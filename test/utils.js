module.exports.delay = function(sec) {
    return new Promise(res => setTimeout(res, sec * 1000));
};
