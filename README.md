# react-scripts-TS fork

This package includes scripts and configuration used by [Create React App](https://github.com/facebookincubator/create-react-app).<br>
Please refer to its documentation:

* [Getting Started](https://github.com/facebookincubator/create-react-app/blob/master/README.md#getting-started) – How to create a new app.
* [User Guide](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md) – How to develop apps bootstrapped with Create React App.


# Custom addition

Translations generator using google translator in the background:  
when you run react-scripts in dev mode:   
`npm start`  
it starts an express server on the same port as the dev server (3000 by default)  
# it adds 2 routes:
## Route 1 - generate a translation
GET `http://localhost:3000/api/translate?lang=$lang&word=$words`   
where:
$lang = is the language, check [this](https://cloud.google.com/translate/docs/languages) table for additional languages.   
eg:   
GET `http://localhost:3000/api/translate?lang=iw&word=hello`    
GET `http://localhost:3000/api/translate?lang=iw&word=hello world`    
will generate and/or modify file at /public/assets/locale/iw.json
with JSON that looks like so:    
`{
   "hello": "שלום",
   "hello world": "שלום עולם"
 }
 `
 
## Route  2 - fetch a translation in development
The translations are generated in public, so webpack will carry them over to the production build,  
however in the meantime durning production (dev server), you might still want to use the translations   
in dev mode and you can do so by accesing the second route like so:   

GET `http://localhost:3000/assets/locale/$lang.json`   
where:   
$lang = is the language, check [this](https://cloud.google.com/translate/docs/languages) table for additional languages.   
eg:   
GET `http://localhost:3000/assets/locale/iw.json`    
which should return in this example:   
`{
   "hello": "שלום",
   "hello world": "שלום עולם"
 }
 `
 
 This technique allows me to pre-generate translation files, and later on fix them with more appropiate words, instead of writing translations from scratch.
 
 I use this during my development project within a redux app.   
 let me know in the issuses if you want to know in detail how I use this technique  
 inside a react + redux project and I will publish a module supporting this way shortly.
 
 
 good luck!