'use strict'

angular.module('bcbsmApp').filter('numberToText', [
	function() {
		return function(input) {
			var ret = '';
			switch(input) {
				case 1:
					ret = 'one';
					break;
				case 2:
					ret = 'two';
					break;
				case 3:
					ret = 'three';
					break;
				case 4:
					ret = 'four';
					break;
				case 5:
					ret = 'five';
					break;
				case 6:
					ret = 'six';
					break;
				case 7:
					ret = 'seven';
					break;
				case 8:
					ret = 'eight';
					break;
				case 9:
					ret = 'nine';
					break;
				case 10:
					ret = 'ten';
					break;
				default:
					ret = input;
					break;
			};

			return ret;
		};
	}
]);

angular.module('bcbsmApp').filter('numberToMonth', [
	function() {
		return function(input) {
			var ret = '';
			switch(input) {
				case 0:
					ret = 'January';
					break;
				case 1:
					ret = 'February';
					break;
				case 2:
					ret = 'March';
					break;
				case 3:
					ret = 'April';
					break;
				case 4:
					ret = 'May';
					break;
				case 5:
					ret = 'June';
					break;
				case 6:
					ret = 'July';
					break;
				case 7:
					ret = 'August';
					break;
				case 8:
					ret = 'September';
					break;
				case 9:
					ret = 'October';
					break;
				case 10:
					ret = 'November';
					break;
				case 11:
					ret = 'December';
					break;
			};

			return ret;
		};
	}
]);