var s = document.createElement('script');
s.src = chrome.extension.getURL('bot.js');
var a = document.createElement('script');
a.src = chrome.extension.getURL('convnet.js');

(document.head||document.documentElement).appendChild(a);

(document.head||document.documentElement).appendChild(s);
a.onload = function() {
    s.parentNode.removeChild(s);
};




a.onload = function() {
    a.parentNode.removeChild(a);
};