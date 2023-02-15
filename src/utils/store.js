//import module
const {LocalStorage} =  require('node-localstorage'); 

// constructor function to create a storage directory inside our project for all our localStorage setItem.
var localStorage = new LocalStorage('./storeChat'); 


module.exports = class store {

    static setItem (index, value) {
        const key = index;
        localStorage.setItem(`${key}-Time`, (new Date()));
        return localStorage.setItem(index, value); 
    }

    static getItem (index) {
        const expires = 60 * 10;
        const key = index;
        const time = localStorage.getItem(`${key}-Time`);
        var startDate = new Date(time);
        var seconds = ((new Date()).getTime() - startDate.getTime()) / 1000;

        if ((seconds > expires) || (!time)) {
            return null;
        } else {
            return localStorage.getItem(index); 
        }

    }

}