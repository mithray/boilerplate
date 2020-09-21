const fs = require('fs')
const pretty = require('pretty')
const path = require('path')
const parse5 = require('parse5')
var minify = require('html-minifier').minify;

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
function rebuild(document, html, body){
//console.log(document)
//console.log(html)
//console.log(body)
  html.childNodes.push(body)
  document.childNodes.push(html)
  return document
}

function createBoilerplate(options){
  const boilerplate = fs.readFileSync(path.join(__dirname,'node_modules/html5-boilerplate/dist/index.html'),'utf8')
  var document = parse5.parse(boilerplate)
//console.log(document)
//console.log(document)
  var html = document.childNodes.filter(obj => obj.nodeName === 'html')[0]
  document.childNodes = document.childNodes.filter(obj => obj.nodeName !== 'html')

  var body = html.childNodes.filter(obj => obj.nodeName === 'body')[0]
  html.childNodes = html.childNodes.filter(obj => obj.nodeName !== 'body')


  scripts = body.childNodes.filter(obj => obj.nodeName === 'script')
  body.childNodes = body.childNodes.filter(obj => obj.nodeName !== 'script')
//  document.html.body.childNodes = document.html.body.childNodes.filter( obj => obj.nodeName !== 'script' )
//  document.childNodes.filter(obj => obj.nodeName === 'html')[0] = 'hi'
 // console.log(document.childNodes.filter(obj => obj.nodeName === 'html')[0])
  if (options.google_analytics.length > 0){
    for(let i = 0; i < scripts.length; i++){
      var script = scripts[i]
      const childNode = script.childNodes[0]
      if(childNode && childNode.value){
        scripts[i].childNodes[0].value = childNode.value.replace('UA-XXXXX-Y',options.google_analytics)
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
  }
  body.childNodes = body.childNodes.concat(scripts)
//console.log(body.childNodes)
//console.log(scripts)
//console.log(scripts.length)
//console.log(scripts[0].attrs)
  document = rebuild(document,html,body)
  const htmlString = pretty(minify(parse5.serialize(document),options.minify))
 // console.log(document)
  console.log(htmlString)
  return htmlString
}

const options = {
  google_analytics: 'uub',
  modernizr: false,
  plugins: false,
  main: false,
  open_graph: {
    title: 'My page',
    type: 'ty type',
    url: 'my url',
    image: 'imy image ',
  },
  css: '',
  minify: {
    removeAttributeQuotes: true,
    removeComments: true,
    collapseWhitespace: true
  }
}


createBoilerplate(options)
