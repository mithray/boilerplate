const fs = require('fs')
const pretty = require('pretty')
const csso = require('csso')
const path = require('path')
const parse5 = require('parse5')
const minify = require('html-minifier').minify;
const merge = require('deepmerge')
const default_options = {
  googleAnalytics: '',
  jsonld: {
    "@context": "https://schema.org",
    "@type": "",
    "title": "this tittle",
    "description": "this site is aosetuh eonhu"
  },
  js: [
    'modernizr',
    'plugins',
    'main'
  ],
  css: [
    'main',
    'normalize',
    'sakura',
//    'mnd'
  ],
  minify: {
    removeComments: true,
    collapseWhitespace: true
  }
}
default_options.openGraph = {
    title: default_options.jsonld.title || '',
    type: default_options.jsonld.type || '',
    url: default_options.jsonld.url || '',
    image: default_options.jsonld.image || '',
    description: default_options.jsonld.description || '',
  }
default_options.description = default_options.jsonld.description

function filterSrcScripts(scripts){
  return scripts.filter( el => {
    return src = el.attrs.filter( attr => { 
      return attr.name === 'src' 
    })[0]
  })
}

function filterGoogleAnalytics(scripts){

  scripts = filterAttribute(scripts, "google.*analytics")
  scripts = filterCode(scripts, "window.ga")

  return scripts
}

function filterCode(scripts, codeMatch){
  return scripts.filter( script => {
    const childNode = script.childNodes[0]
    if (childNode && childNode.value.match(/\bwindow.ga\b/)){
      return false
    }
    return true
  })
}

function filterAttribute(scripts, attrMatch){

  return scripts.filter( script => {
    const attr = script.attrs[0]  
    const regex = new RegExp(attrMatch)
    if (attr && attr.value && attr.value.match(regex)){
      return false
    }
    return true
  })

}
function rebuild(document, html, head, body){
//console.log(document)
//console.log(html)
//console.log(body)
  html.childNodes.push(head)
  html.childNodes.push(body)
  document.childNodes.push(html)
  return document
}

function createBoilerplate(options=default_options){
  options = merge(default_options, options)
  const boilerplate = fs.readFileSync(path.join(__dirname,'node_modules/html5-boilerplate/dist/index.html'),'utf8')
  const css = {
    normalize: fs.readFileSync(path.join(__dirname,'node_modules/html5-boilerplate/dist/css/normalize.css'),'utf8'),
    main: fs.readFileSync(path.join(__dirname,'node_modules/html5-boilerplate/dist/css/main.css'),'utf8'),
  }
  var document = parse5.parse(boilerplate)
  var html = document.childNodes.filter(obj => obj.nodeName === 'html')[0]
  document.childNodes = document.childNodes.filter(obj => obj.nodeName !== 'html')
  

  var body = html.childNodes.filter(obj => obj.nodeName === 'body')[0]
  var head = html.childNodes.filter(obj => obj.nodeName === 'head')[0]
  html.childNodes = html.childNodes.filter(obj => obj.nodeName !== 'body')
  html.childNodes = html.childNodes.filter(obj => obj.nodeName !== 'head')

  // JS
  scripts = body.childNodes.filter(obj => obj.nodeName === 'script')
  body.childNodes = body.childNodes.filter(obj => obj.nodeName !== 'script')
  if (options.googleAnalytics.length > 0){
    for(let i = 0; i < scripts.length; i++){
      var script = scripts[i]
      const childNode = script.childNodes[0]
      if(childNode && childNode.value){
        scripts[i].childNodes[0].value = childNode.value.replace('UA-XXXXX-Y',options.googleAnalytics)
      }
    }
  } else {
    scripts = filterGoogleAnalytics(scripts)
  }
  if (!options.plugins){
    scripts = filterAttribute(scripts, 'main.js')
  }
  if (!options.main){
    scripts = filterAttribute(scripts, 'plugins.js')
  }
  if (!options.modernizr){
    scripts = filterAttribute(scripts, 'modernizr.*js')
    html.attrs = html.attrs.filter( el => {
      return el.value !== "no-js"
    })
  }
  body.childNodes = body.childNodes.concat(scripts)
  // /JS

  // OG
/*
  const ogPrototype = head.childNodes.filter(obj=>{
    if(obj.attrs && obj.attrs[0] && obj.attrs[0].value.startsWith('og:')){
      return true
    }
    return false
  })[0]
*/
  head.childNodes = head.childNodes.filter(obj => {
    if(obj.attrs && obj.attrs[0] && obj.attrs[0].value.startsWith('og:')){
      return false
    }
    return true
  })
  const ogKeys = Object.keys(options.openGraph)
  for (let i = 0; i < ogKeys.length; i++){

    const property = ogKeys[i] 
    const content = options.openGraph[ogKeys[i]]
    const ogFragment = `<meta property="og:${property}" content="${content}">`
    const metaOg = parse5.parseFragment(ogFragment, head.childNodes)

    head.childNodes.push(metaOg.childNodes[0])
  }
  // /OG
  head.childNodes = head.childNodes.filter(obj => {
//    console.log(obj)
    if (!obj.attrs || obj.attrs.length < 1) return true
    const notStylesheet = obj.attrs.filter(el=>{ return el.value !== 'stylesheet'})
    if (notStylesheet.length > 0) return true
    return false
  })
  options.css = options.css.filter((item, index) => options.css.indexOf(item) === index)
  for(let i = 0; i < options.css.length; i++){
    var fragment = ''
/*
    if(options.css[i].startsWith('sakura')){
      const data = fs.readFileSync(path.join(__dirname,'node_modules/sakura.css/css/',options.css[i]+'.css'),'utf8')
      fragment = `<style type="text/css">${csso.minify(data).css}</style>`
    } else {
    }*/
      fragment = `<link rel=stylesheet href=css/${options.css[i]}.css>`
    const node = parse5.parseFragment(fragment, head.childNodes)
    head.childNodes.push(node.childNodes[0])
  }

//   <meta charset="utf-8">
  // <title></title>



  document = rebuild(document,html,head, body)
  const htmlString = pretty(minify(parse5.serialize(document),options.minify))
  console.log(htmlString)
  return htmlString
}

module.exports = createBoilerplate

createBoilerplate()
