// closure to encapsulate variables
var game = (function(){
    var energy = 0;
    var energy_grow_rate = 1;

    // you get energy for inviting friends, and for clicking a button that says
    // "I like this game"
    var invite_energy_bonus = 2000;
    var friend_accepts_energy_bonus = 5000;
    var like_energy_bonus = 500;
    var purchase_bonus = 10000;

    var intervalID;

    var invite_button = document.querySelector("#invite");
    var like_button = document.querySelector("#like");
    var purchase_button = document.querySelector("#purchase");

    // run this every so often to give the player more energy
    var grow_energy = function() {
        update_energy(1);
    };

    var add_like_bonus = function() {
        update_energy(like_energy_bonus);
    }

    var add_invite_bonus = function() {
        update_energy(invite_energy_bonus);
    }

    var add_friend_accepts_bonus = function() {
        update_energy(friend_accepts_energy_bonus);
    }

    var add_purchase_bonus = function() {
        update_energy(purchase_bonus);
    }
    
    var update_energy = function(amount) {
        energy += amount;
        updateDOM();
    }

    var start_counter = function() {
        if (!intervalID) {
            intervalID = setInterval(grow_energy, 1000 / energy_grow_rate);
        }
    }

    var stop_counter = function() {
        if (intervalID) {
            clearInterval(intervalID);
            intervalID = 0;
        }
    }
    var updateDOM = function() {
        document.querySelector("#energy").innerText = energy;
    }

    var set_grow_rate = function(rate) {
        energy_grow_rate = rate;
        stop_counter();
        start_counter();
    }

    invite_button.addEventListener("click", add_invite_bonus);
    like_button.addEventListener("click", add_like_bonus);
    purchase_button.addEventListener("click", add_purchase_bonus);

    start_counter();

    return {set_grow_rate: set_grow_rate};
})()