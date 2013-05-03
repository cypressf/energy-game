// closure to encapsulate variables
var game = (function(){
    var points = 0;
    var point_grow_rate = 1;

    // you get points for inviting friends, and for clicking a button that says
    // "I like this game"
    var invite_point_bonus = 2000;
    var friend_accepts_point_bonus = 5000;
    var like_point_bonus = 500;

    var intervalID;

    var invite_button = document.querySelector("#invite");
    var like_button = document.querySelector("#like");

    // run this every so often to give the player more points
    var grow_points = function() {
        points += point_grow_rate;
        updateDOM();
    };

    var add_like_bonus = function() {
        points += like_point_bonus;
        updateDOM();
    }

    var add_invite_bonus = function() {
        points += invite_point_bonus;
        updateDOM();
    }

    var add_friend_accepts_bonus = function() {
        points += friend_accepts_point_bonus;
        updateDOM();
    }
    
    var start_counter = function() {
        if (!intervalID) {
            intervalID = setInterval(grow_points, 1000);
        }
    }

    var stop_counter = function() {
        if (intervalID) {
            clearInterval(intervalID);
            intervalID = 0;
        }
    }
    var updateDOM = function() {
        document.querySelector("#points").innerText = points;
    }

    invite_button.addEventListener("click", add_invite_bonus);
    like_button.addEventListener("click", add_like_bonus);

    start_counter();

})()