import { resolve } from "node:path";
import { defineConfig } from "vite";

function replaceOpenCvFunction(
  source: string,
  startMarker: string,
  endMarker: string,
  replacement: string
) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start === -1 || end === -1) {
    throw new Error(`无法应用 OpenCV MV3 补丁：${startMarker}`);
  }

  return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

function cspSafeOpenCv() {
  return {
    name: "justlisten-csp-safe-opencv",
    enforce: "pre" as const,
    transform(source: string, id: string) {
      if (!id.includes("@techstark/opencv-js/dist/opencv.js")) {
        return null;
      }

      let patched = replaceOpenCvFunction(
        source,
        "function createNamedFunction(name,body){",
        "function extendError",
        "function createNamedFunction(name,body){return function(){\"use strict\";return body.apply(this,arguments)}}"
      );

      patched = replaceOpenCvFunction(
        patched,
        "function makeDynCaller(dynCall){",
        "var fp;",
        "function makeDynCaller(dynCall){return function(){return dynCall.apply(null,[rawFunction].concat(Array.prototype.slice.call(arguments)))}}"
      );

      patched = replaceOpenCvFunction(
        patched,
        "function craftInvokerFunction(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc){",
        "function heap32VectorToArray",
        [
          "function craftInvokerFunction(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc){",
          "var argCount=argTypes.length;",
          "if(argCount<2){throwBindingError(\"argTypes array size mismatch! Must at least get return value and 'this' types!\")}",
          "var isClassMethodFunc=argTypes[1]!==null&&classType!==null;",
          "var needsDestructorStack=false;",
          "for(var i=1;i<argTypes.length;++i){if(argTypes[i]!==null&&argTypes[i].destructorFunction===undefined){needsDestructorStack=true;break}}",
          "var returns=argTypes[0].name!==\"void\";",
          "return function(){",
          "if(arguments.length!==argCount-2){throwBindingError(\"function \"+humanName+\" called with \"+arguments.length+\" arguments, expected \"+(argCount-2)+\" args!\")}",
          "var destructors=needsDestructorStack?[]:null;",
          "var wiredByType=[];",
          "var callArgs=[cppTargetFunc];",
          "if(isClassMethodFunc){wiredByType[1]=argTypes[1].toWireType(destructors,this);callArgs.push(wiredByType[1])}",
          "for(var argumentIndex=0;argumentIndex<argCount-2;++argumentIndex){var typeIndex=argumentIndex+2;wiredByType[typeIndex]=argTypes[typeIndex].toWireType(destructors,arguments[argumentIndex]);callArgs.push(wiredByType[typeIndex])}",
          "var returnValue=cppInvokerFunc.apply(null,callArgs);",
          "if(needsDestructorStack){runDestructors(destructors)}else{for(var destructorIndex=isClassMethodFunc?1:2;destructorIndex<argTypes.length;++destructorIndex){var destructor=argTypes[destructorIndex].destructorFunction;if(destructor!==null){destructor(wiredByType[destructorIndex])}}}",
          "if(returns){return argTypes[0].fromWireType(returnValue)}",
          "}",
          "}"
        ].join("")
      );

      patched = replaceOpenCvFunction(
        patched,
        "function __emval_get_method_caller(argCount,argTypes){",
        "function __emval_get_property",
        [
          "function __emval_get_method_caller(argCount,argTypes){",
          "var types=__emval_lookupTypes(argCount,argTypes);",
          "var retType=types[0];",
          "var caller=function(handle,name,destructors,args){",
          "var values=[];",
          "var offset=0;",
          "for(var i=0;i<argCount-1;++i){values[i]=types[i+1].readValueFromPointer(args+offset);offset+=types[i+1].argPackAdvance}",
          "var returnValue=handle[name].apply(handle,values);",
          "for(var deleteIndex=0;deleteIndex<argCount-1;++deleteIndex){if(types[deleteIndex+1].deleteObject){types[deleteIndex+1].deleteObject(values[deleteIndex])}}",
          "if(!retType.isVoid){return retType.toWireType(destructors,returnValue)}",
          "};",
          "return __emval_addMethodCaller(caller);",
          "}"
        ].join("")
      );

      if (patched.includes("new Function") || patched.includes("new_(Function")) {
        throw new Error("OpenCV 仍包含 Chrome MV3 不允许的动态代码生成。");
      }

      return { code: patched, map: null };
    }
  };
}

export default defineConfig({
  plugins: [cspSafeOpenCv()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production")
  },
  resolve: {
    alias: [
      {
        find: /^onnxruntime-web$/,
        replacement: resolve(
          import.meta.dirname,
          "node_modules/onnxruntime-web/dist/ort.wasm.min.mjs"
        )
      }
    ],
    conditions: ["onnxruntime-web-use-extern-wasm"]
  },
  build: {
    copyPublicDir: false,
    emptyOutDir: false,
    outDir: "dist/ocr",
    lib: {
      entry: resolve(
        import.meta.dirname,
        "src/features/transcript/recognition/OcrEngine.ts"
      ),
      formats: ["es"],
      fileName: () => "paddle-engine.js"
    }
  }
});
