const { pipeline,env,AutoModelForSeq2SeqLM,AutoTokenizer,AutoConfig } = require("@huggingface/transformers")

const progressCallback = (statusInfo) => {
    console.log(statusInfo)
    const { downloadedBytes, totalBytes, fileName } = statusInfo;
    const progress = ((downloadedBytes / totalBytes) * 100).toFixed(2);

    console.log(`Downloading ${fileName || 'model'}: ${progress}%`);
};


const translate_transformer = async(resource_object,text_map, source_lang = 'eng_Latn', target_lang = 'fra_Latn') => {
    env.cacheDir = '../cache'
    console.log('Translating text')
    const translator = await pipeline('translation','Xenova/nllb-200-distilled-600M',{dtype:'q8',progressCallback});
    resource_object[target_lang] = {}
    for (const [key,value] of text_map) {
        const output = await translator(key , {
            src_lang: source_lang,
            tgt_lang: target_lang
        });
        text_map.set(key,output[0].translation_text)
        resource_object[target_lang][key] = output[0].translation_text
        console.log(key, output[0].translation_text)
    }


   return ;
}

module.exports = translate_transformer;