if (typeof exports !== 'undefined') {
    this["like_button"] = module.exports;
}
this["like_button"] = {
    /*===================================================
    Keep track of how many times the like button has been
    pressed today, how long it needs to be on cooldown,
    and when it was first pressed.
    ===================================================*/
    // Keep track of how many times the button has been pressed today.
    // Cannot exceed maximum.
    today: {
        max: 5,
        count: 0,
    },

    cooldown: {
        timeout: 0; // milliseconds, how long the button takes before it can be pressed again
        start_time: 0;
        set_interval_id: 0;
        constant: 50; // the cooldown will increase by constant * this.today.count^2
    },

    energy_bonus: 500,

    /*=====================================================
    FUNCTIONS
    ======================================================*/

    // When the button is pressed, test to see if it's on cooldown,
    // and if it's not, return the bonus energy, then put it
    // on cooldown and keep track of the number of presses. If it is on cooldown,
    // don't do anything.
    press_button: function() {
        if (this.on_cooldown()) {
            return false;
        }

        // if you've exceeded the limit of clicks per day
        if (this.today.count >= this.today.max) {

            // if you've waited 24 hours since last click, reset the allowed clicks
            if (Date.now() - this.cooldown.start_time < 24 * 60 * 60 * 1000) {
                this.today.count = 0;
            }
            else {
                return false;
            }
        }
        this.today.count ++;
        this.start_cooldown();
        return this.energy_bonus;
    },


    // Return true if button is on cooldown. Return false if it is ready
    // to be pressed again (not on cooldown).
    on_cooldown: function() {
        if (Date.now() > this.cooldown.start_time + this.cooldown.timeout) {
            return false;
        }
        else {
            return true;
        }
    },

    // Begin the cooldown for the button. Increment the timeout (cooldown takes
    // longer every time) and set the start time.
    start_cooldown: function() {
        this.cooldown.start_time = Date.now();
        this.cooldown.timeout = Math.pow(this.today.count, 2);
    },

    extend: function() {
        var like_button = Object.create(this);
        like_button.today = Object.create(this.today);
        like_button.cooldown = Object.create(this.cooldown);
        return like_button;
    }
}