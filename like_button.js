module.exports = {
    /*===================================================
    Keep track of how many times the like button has been
    pressed today, how long it needs to be on cooldown,
    and when it was first pressed.
    ===================================================*/
    // Keep track of how many times the button has been pressed today.
    // Cannot exceed maximum.
    today: {
        count: 0,
    },

    cooldown: {
        timeout: 0, // milliseconds, how long the button takes before it can be pressed again
        start_time: 0,
        end_time:0,
        set_interval_id: 0,
    },
    max_per_day: 5,
    cooldown_constant: 0.2*60*1000,
    energy_bonus: 500,


    session: null, // stored in redis on the server
    socket: null,

    /*=====================================================
    FUNCTIONS
    ======================================================*/

    // When the button is pressed, test to see if it's on cooldown,
    // and if it's not, return the bonus energy, then put it
    // on cooldown and keep track of the number of presses. If it is on cooldown,
    // don't do anything.
    press_button: function() {
        if (this.remaining_time()) {
            return false;
        }

        var timeout;

        // If you've exceeded the limit of clicks per day,
        // set timeout to 24 hrs
        if (this.today.count >= this.max_per_day) {
            timeout = 24 * 60 * 60 * 1000;
            this.today.count = 0;
        }
        // Otherwise, it's a shorter timeout
        else {
            this.today.count ++;
            timeout = Math.pow(this.today.count, 2) * this.cooldown_constant;
        }
        this.start_cooldown(timeout);
        this.start_counter();
        return this.energy_bonus;
    },


    // Begin the cooldown for the button. Increment the timeout (cooldown takes
    // longer every time) and set the start time.
    start_cooldown: function(timeout) {
        this.cooldown.start_time = Date.now();
        this.cooldown.end_time = this.cooldown.start_time + timeout;
    },

    remaining_time: function() {
        if (this.cooldown.end_time - Date.now() > 0) {
            return this.cooldown.end_time - Date.now();
        }
        else {return 0;}
    },

    start_counter: function() {
        var that = this;
        this.cooldown.set_interval_id = setInterval(function() {

            if (that.remaining_time()) {
                that.sync();
            }
            else {
                that.sync();
                that.stop_counter();
            }
        }, 1000);
    },

    stop_counter: function() {
        if (this.cooldown.set_interval_id) {
            clearInterval(this.cooldown.set_interval_id);
        }
        this.cooldown.set_interval_id = 0;
    },

    clear_cooldown: function() {
        this.cooldown.end_time = 0;
        this.today.count = 0;
    },

    sync: function() {
        return false;
    },

    extend: function() {
        var like_button = Object.create(this);
        like_button.today = Object.create(this.today);
        like_button.cooldown = Object.create(this.cooldown);
        return like_button;
    }
}