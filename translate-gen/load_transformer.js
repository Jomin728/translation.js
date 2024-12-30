const { pipeline,env,AutoModelForSeq2SeqLM,AutoTokenizer,AutoConfig } = require("@huggingface/transformers")

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

async function loadModelGoogleT5() {
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


module.exports = { loadModel };