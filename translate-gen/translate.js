const {fork} = require('child_process');
const jscodeshift = require(`jscodeshift`);
const  translate_transformer = require(`./translate_transformer`);
const fs = require(`fs`);
const path = require(`path`);
const translateGenPath = path.join(__dirname, `../`);
const translateGenFiles = fs.readdirSync(translateGenPath);
const languages = [`en`, `es`, `fr`, `de`, `it`, `ja`, `ko`, `zh`];
const ignoreDirectories = [`node_modules`, `.git`, `.next`, `public`, `styles`];
const fileNamesToIgnore = ['.config']
const functionsCallsToIgnore = ['require','cva','cn','fetch','FontSans','map','split','join','filter','reduce','concat','includes','indexOf','find','findIndex','some','every','sort','slice','splice','push','pop','shift','unshift','reverse','flat','flatMap','fill','copyWithin']
const ignoreAttributes = ['href','src','className','style','d','viewBox','fill','xmlns','xmlnsXlink','icon']
const allowedDirectories = ['src']
const allowedExtensions = [`js`, `jsx`, `ts`, `tsx`];
const staticText = new Map();

const checkSubstringMatch = (strings, targetString) => {
    for (const str of strings) {
      if (targetString.includes(str)) {
        return true; 
      }
    }
    return false;
  }
  

const deepSearch = (obj,typeArray) => {
  
    if(typeof obj === 'object' && Array.isArray(obj) === false)
    {
        for (const key in obj) {
                if(key == 'loc')
                    continue

                const element = obj[key];
                if(typeof element != 'object')
                {
                    // console.log(obj['type'],obj['value'])
                    if(obj['type'] && typeArray.includes(obj['type']))
                    {
                        if(obj['value'] != undefined && typeof obj['value'] == 'string')
                        staticText.delete(obj['value'])
                        else if(obj['type'] == 'TemplateLiteral')
                        {
                            obj.quasis.forEach(quasi => {
                                const text = quasi.value.raw.trim();
                                if (text) {
                                    staticText.delete(text, '');
                                }
                            });
            
                        }
                    }
                }
                else
                {
                    deepSearch(element,typeArray)
                }
        }
    }
    else if(Array.isArray(obj))
    {
        for (const key of obj) {
                if(typeof key == 'object')
                {
                    deepSearch(key,typeArray)
                }
        }
    }
}

const translate = async (languages, dir = translateGenPath,source_lang ) =>
{
    traverseDir(dir, transform);
    console.log(staticText)
    saveToFile(staticText, languages)


}

const traverseDir = (dir = translateGenPath, callback = transform) => {
    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.join(dir, file);
      if(fs.statSync(filePath).isDirectory() && ignoreDirectories.includes(file))
        return
      if (fs.statSync(filePath).isDirectory()) {
        traverseDir(filePath, callback);
      } else {
        if(allowedExtensions.includes(file.split('.').pop()) && !checkSubstringMatch(fileNamesToIgnore,file))
        {
            callback(filePath,file.split('.').pop());
            console.log(file)
        }
      }
    });
  };

const ignoreStrings = ['\n']

const transform = (filePath,ext)=>{

        let parser = 'babel'
        const fileContent = fs.readFileSync(filePath, `utf8`);
        if(ext === 'tsx')
            parser = 'tsx'
        else if(ext === 'ts')
            parser = 'ts'
        const j = jscodeshift.withParser(parser);
        const ast = j(fileContent);
        let jsxTexts = ast.find(jscodeshift.JSXText)
        let jstStringLiteral = ast.find(jscodeshift.StringLiteral)
        let jstLiteral = ast.find(jscodeshift.Literal)
        let jstTemplateLiteral = ast.find(jscodeshift.TemplateLiteral)
        let JSXExpressionContainer = ast.find(jscodeshift.JSXExpressionContainer)
        let jstJSXAttribute = ast.find(jscodeshift.JSXAttribute)
        let jstCallExpression = ast.find(jscodeshift.CallExpression)
        let jstImportDeclaration = ast.find(jscodeshift.ImportDeclaration)
        jsxTexts.forEach((path) => {
          let text = path.node.value.trim()
          if(text.length > 0 && !ignoreStrings.includes(text))
          {
            staticText.set(text,'')
          }
        })
        jstStringLiteral.forEach((path) => {
            let text = path.node.value.trim()
            if(text.length > 0 && !ignoreStrings.includes(text))
            {
              staticText.set(text,'')
            }
          })
        jstLiteral.forEach((path) => {
            if(typeof path.node.value !== 'string')
              return
            let text = path.node.value.trim()
            if(text.length > 0 && !ignoreStrings.includes(text))
            {
              staticText.set(text,'')
            }
          })
        jstTemplateLiteral.forEach(path => {
            path.node.quasis.forEach(quasi => {
                const text = quasi.value.raw.trim();
                if (text) {
                    staticText.set(text, '');
                }
            });
        });
        JSXExpressionContainer.forEach(path => {
            if (j.StringLiteral.check(path.node.expression)) {
                const text = path.node.expression.value.trim();
                if (text) {
                    staticText.set(text, '');
                }
            } else if (j.TemplateLiteral.check(path.node.expression)) {
                path.node.expression.quasis.forEach(quasi => {
                    const text = quasi.value.raw.trim();
                    if (text) {
                        staticText.set(text, '');
                    }
                });
            }
        });
        jstJSXAttribute.forEach((path)=>{
            if( ignoreAttributes.includes(path.node.name.name))
            {
                 deepSearch(path.node,['StringLiteral','Literal','TemplateLiteral'])
            }
        })
        jstCallExpression.forEach((path) => {
            if(functionsCallsToIgnore.includes(path.node.callee.name))
            {
                if(['StringLiteral','Literal'].includes(path.node.arguments[0].type) && typeof path.node.arguments[0].value == 'string' )
                    deepSearch(path.node.arguments,['StringLiteral','Literal',`TemplateLiteral`])
                // staticText.delete(path.node.arguments[0].value)
            }
        })
        jstImportDeclaration.forEach((path) => {
            if(path.node && path.node.source && path.node.source.value)
            {
                staticText.delete(path.node.source.value)
            }
        })

    
    }



saveToFile = async (staticText, language) => {
  const resources = {}
    const languageTranslationPromises = []
    language.forEach((lang) => {
        languageTranslationPromises.push(translate_transformer(resources,staticText,'eng_Latn',lang))
    })
  const translations = await Promise.all(languageTranslationPromises)
  const filePath = path.join(translateGenPath, `public/translation.json`);
  let resource_string = JSON.stringify(resources).split('",').join('",\n')
  resource_string = resource_string.split(':{').join(':{\n')
  resource_string = resource_string.split('},').join('},\n')
  fs.writeFileSync(filePath, resource_string, `utf8`);
}

module.exports = { translate };



