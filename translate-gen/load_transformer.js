const { pipeline,env,AutoModelForSeq2SeqLM,AutoTokenizer,AutoConfig,T5Tokenizer,T5Model,T5ForConditionalGeneration,MT5ForConditionalGeneration } = require("@huggingface/transformers")

let translator = null; // Store the promise

const progressCallback = (statusInfo) => {
    console.log(statusInfo)
    const { downloadedBytes, totalBytes, fileName } = statusInfo;
    const progress = ((downloadedBytes / totalBytes) * 100).toFixed(2);

    console.log(`Downloading ${fileName || 'model'}: ${progress}%`);
};

async function loadModel() {
    if (!translator) {
        translator = pipeline('translation','Xenova/nllb-200-distilled-600M',{dtype:'q8',progressCallback})
        .then(classifier => {
            console.log("Model loaded");
            return classifier;
        })
        .catch(err => {
            console.error("Error loading model:", err);
            translator = null; 
            throw err; 
        });
    }
    return translator;
}

async function loadModelM2M() {
    // Varosa/m2m100-onnx
    // Xenova/mbart-large-50-many-to-many-mmt
    // Xenova/m2m100_418M
    // Xenova/nllb-200-distilled-600M
    
    if (!translator) {
        console.log("Retreiving Model")
        translator = pipeline('translation','Xenova/nllb-200-distilled-600M',{dtype:{encoder_model:"q8",decoder_model_merged:"q8"},progressCallback})
        .then(classifier => {
            console.log("Model loaded");
            return classifier;
        })
        .catch(err => {
            console.error("Error loading model:", err);
            translator = null; 
            throw err; 
        });
    }
    return translator;
}


async function loadAutoModelT5() {
    // Xenova/t5-small
    if (!translator) {
        let hf_token = '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'
        process.env.HF_TOKEN = hf_token    
        let tokeniser = await AutoTokenizer.from_pretrained('Xenova/t5-small', {progressCallback});
        let model = await AutoModelForSeq2SeqLM.from_pretrained('Xenova/t5-small')
        translator = Promise.resolve().then(classifier => {
            console.log("Model loaded");
            // console.log(tokeniser,model)
            return [tokeniser,model];
        })
        .catch(err => {
            console.error("Error loading model:", err);
            translator = null; 
            throw err; 
        });
    }
    return translator;
}




module.exports = { loadModel,loadAutoModelT5,loadModelM2M };