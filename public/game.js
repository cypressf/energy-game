// CLIENT SIDE CODE
// Keep track of what buttons players press, and perform the
// actions related to those buttons.
// Slowly grow the player's energy reserves

var game = (function(){

    /*===================================================
    ENERGY
    The player accumulates energy, slowly over time.
    ===================================================*/
    var energy = 0; // starting energy
    var energy_grow_rate = 0.5; // energy per second


    /*===================================================
    ENERGY BONUSES
    You get energy for inviting friends, and for clicking
    a button that says "I like this game"
    ===================================================*/
    var invite_energy_bonus = 2000; // energy
    var friend_accepts_energy_bonus = 5000; // energy
    var like_energy_bonus = 500; // energy
    var purchase_bonus = 10000; // energy


    /*===================================================
    LIKE BUTTON ATTRIBUTES
    Keep track of how many times the like button has been
    pressed today, how long it needs to be on cooldown,
    and when it was first pressed.
    ===================================================*/
    var like_count = 0; // number of times the like button was pressed today
    var like_timeout = 0; // milliseconds
    var MAX_LIKE_COUNT = 5; // button presses
    var start_time = 0; // for the like button cooldown timer
    var like_timer_id; // the ID of the setInterval for the like timer


    /*===================================================
    DOM ELEMENTS
    All the buttons the player can click on
    ===================================================*/
    var invite_button = document.querySelector("#invite");
    var invite_button_default = invite_button.innerHTML;

    var like_button = document.querySelector("#like");
    var like_button_default = like_button.innerHTML;

    var purchase_button = document.querySelector("#purchase");
    var purchase_button_default = purchase_button.innerHTML;



    // The energy grows slowly on its own.
    // A setInterval callback keeps track of how often it updates
    var grow_interval_id; // the ID of the setInterval for growing the energy


    var set_button_dom = function(button, new_text) {
        button.childNodes[0].innerHTML = new_text;
    }

    // Pass the DOM element for the "like" button
    // Compute the remaining time until you can press the like button again
    // display the remaining time in the DOM button
    var like_countdown = function(button){
        var min;
        var sec;  
        var seconds_left = (like_timeout - (Date.now() - start_time)) / 1000;
        
        // The "like" button is off cooldown! enable it again!
        if (seconds_left < 0){
            clearInterval(like_timer_id);
            button.classList.remove("disabled");
            button.removeAttribute("disabled");
            button.innerHTML = like_button_default;
        }

        // The "like" button is still on cooldown. Update the time remaining
        else {
            min = Math.floor(seconds_left / 60);
            min = (min<10? '0':'') + min;
            sec = Math.round(seconds_left % 60);
            sec = (sec<10? '0':'') + sec;
            set_button_dom(button, "Wait " + min +  ":" + sec);
        }
        
    }

    // When the "like" button is pressed, add bonus energy
    var add_like_bonus = function() {
        // only add the bonus, if the like button isn't on cooldown
        if (Date.now() > start_time + like_timeout) {

            // if it hasn't been pressed too many times today,
            // award the bonus energy!
            if (like_count < MAX_LIKE_COUNT) {
                like_count ++;
                // increase the amount of time a player has to wait
                like_timeout += (0.2 * 1000 * 60) * like_count * like_count; // milliseconds
                // disable the button for a while
                this.classList.add("disabled");
                this.setAttribute("disabled", "true");
                start_time = Date.now();
                // make the like button count down
                var that = this;
                like_countdown(that);
                like_timer_id = setInterval(function(){
                    like_countdown(that);
                }, 1000);
                // give bonus energy
                update_energy(like_energy_bonus);

            }

            // the like button has been pressed too many times today!
            else {
                console.log(this);
                this.classList.add("disabled");
                this.setAttribute("disabled", "true");
                this.innerHTML = "Come back tomorrow!";
            }  
        }

    }

    var add_invite_bonus = function() {
        try_posting();
        update_energy(invite_energy_bonus);
    }

    var add_friend_accepts_bonus = function() {
        update_energy(friend_accepts_energy_bonus);
    }

    var add_purchase_bonus = function() {
        update_energy(purchase_bonus);
    }
    
    // energy slowly grows over time;
    var grow_energy = function() {
        update_energy(1);
    };

    var update_energy = function(amount) {
        energy += amount;
        updateDOM();
    }

    var start_counter = function() {
        if (!grow_interval_id) {
            grow_interval_id = setInterval(grow_energy, 1000 / energy_grow_rate);
        }
    }

    var stop_counter = function() {
        if (grow_interval_id) {
            clearInterval(grow_interval_id);
            grow_interval_id = 0;
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

    function post_payment(obj) {
        var req = new XMLHttpRequest();
        req.addEventListener("load", add_purchase_bonus());
        req.open("POST", "/api/payments", true);
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify(obj));
    }

    // Submit the Stripe purchase form (it's all made by Stripe, not me)
    var purchase = function() {
        var token = function(res){
            post_payment(res);
        };

        StripeCheckout.open({
          key:         'pk_ZxofZArpz2hkEuDrzSSwS65zHmew1',
          address:     true,
          amount:      99,
          name:        '10,000 energy',
          panelLabel:  'Buy it!',
          token:       token
        });

        return false;
    }

    // invite_button.addEventListener("click", add_invite_bonus);
    like_button.addEventListener("click", add_like_bonus);
    purchase_button.addEventListener("click", purchase);
    // invite_button.addEventListener("click", try_posting);

    start_counter();

    return {set_grow_rate: set_grow_rate};
})()