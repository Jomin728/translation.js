const { pipeline,env,AutoModelForSeq2SeqLM,AutoTokenizer,AutoConfig } = require("@huggingface/transformers")
const {loadModel,loadAutoModelT5,loadModelM2M} = require('./load_transformer')
const { parentPort,isMainThread } = require('node:worker_threads');

const translatePromise = async (key,source_lang,target_lang) =>{
    const translator = await loadModel();
    return new Promise(async(resolve,reject)=>{
        const output = await translator(key , {
            src_lang: source_lang,
            tgt_lang: target_lang
        });
        console.log(key, output[0].translation_text)
        resolve(output)
    })
}

// const translate_transformer = async(text_map, source_lang = 'eng_Latn', target_lang = 'fra_Latn') => {
//     console.log('Translating text')
//     const translator = await loadModel();
//     let resource_object = {}
//     let promisearray=[]
//     console.log(text_map,text_map.length)
//     for (const [key,value] of text_map) {
//         const output = await translator(key , {
//             src_lang: source_lang,
//             tgt_lang: target_lang
//         });
//         resource_object[key] = output[0].translation_text
//         console.log(key, output[0].translation_text)
//     }

//    return Promise.resolve(resource_object)
// }

const translate_transformerM2M100 = async( text_map, source_lang = 'eng_Latn', target_lang = 'fra_Latn') => {
    console.log('Translating text')
    const translator = await loadModelM2M();
    let resource_object = {}
    let promisearray=[]
    console.log(text_map,text_map.length)
    for (const [key,value] of text_map) {
        const output = await translator(key , {
            src_lang: "eng_Latn",
            tgt_lang: "ita_Latn"
        });
        resource_object[key] = output[0].translation_text
        console.log(key, output[0].translation_text)
    }

   return Promise.resolve(resource_object)
}

const translate_transformer_Google = async(text_map, source_lang = 'eng_Latn', target_lang = 'fra_Latn') => {
    console.log('Translating text')
    const [tokeniser,model] = await loadAutoModelT5();
    let resource_object = {}
    let promisearray=[]
    console.log(text_map,text_map.length)
    for (const [key,value] of text_map) {
        let input_text =   'Translate English to French: '+ key ;
        let input_ids = await tokeniser(input_text, { return_tensors: "pt" });
        let outputs = await model.generate({...input_ids});
        let decoded = await tokeniser.decode(outputs[0],{skip_special_tokens:true});
        resource_object[key] = decoded
        console.log(key, decoded)
    }

   return Promise.resolve(resource_object)
}

if (isMainThread) {
    throw new Error('This script should only be run as a worker thread');
  }
  
parentPort.on("message", async (message) => {
   let response = await translate_transformerM2M100(message.chunk,message.src_lang,message.lang);
   parentPort.postMessage(response);
    if(message.exit)
        process.exit(0);
  });
  

