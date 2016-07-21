var bot = document.createElement('script');
bot.src = chrome.extension.getURL('bot.js');
var convnet = document.createElement('script');
convnet.src = chrome.extension.getURL('convnet.js');
var rnet = document.createElement('script');
rnet.src = chrome.extension.getURL('rl.js');

(document.head||document.documentElement).appendChild(convnet);
(document.head||document.documentElement).appendChild(rnet);

(document.head||document.documentElement).appendChild(bot);
convnet.onload = function() {
    convnet.parentNode.removeChild(convnet);
};
rnet.onload = function() {
    rnet.parentNode.removeChild(rnet);
};

bot.onload = function() {
    bot.parentNode.removeChild(bot);
};


