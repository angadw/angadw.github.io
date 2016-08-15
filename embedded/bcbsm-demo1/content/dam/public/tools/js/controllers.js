'use strict';

angular.module('bcbsmApp').controller('SubsidyController', ['$scope', '$http', '$timeout',
	function($scope, $http, $timeout) {
		$scope.init = function() {
			CQ_Analytics.ClientContextUtils.onStoreInitialized("profile", function(event) {
				$scope.profilestore = CQ_Analytics.ClientContextMgr.getRegisteredStore("profile");
				$scope.formData.zipcode = $scope.profilestore.getProperty('zipcode');
				$scope.formData.county = $scope.profilestore.getProperty('county');
				$scope.formData.countyFormatted = $scope.profilestore.getProperty('county-formatted');

				if($scope.formData.zipcode && $scope.formData.county && $scope.formData.countyFormatted) {
					$scope.status.first.success = true;
					$scope.stateHandler(1);
				}
			});
		};

		$scope.fixPlaceholderIE = function() {
			// jQuery.placeholder support
			// if (!$.support.placeholder)
			jQuery.support.placeholder = (function(){
			    var i = document.createElement('input');
			    return 'placeholder' in i;
			})();

			// ===============================
			// Check for placeholder support
			// If not present replace with javascript substitute
			// ===============================
			var inputText = $('#subsidyModal input[type=text]');
			var va; // value
			var ph; // placeholder
			if (!$.support.placeholder) {
			    $('#subsidyModal input[type=text]').each(function() {
			        va = $(this).val();
			        ph = $(this).attr('placeholder');
			        // if the value is empty, put the placeholder value in it's place
			        if (!va || va == '') {
			            $(this).val(ph);
			        }
			    });
			    // replaceing the placeholder type effect
			    $(inputText).focus(function() {
			        va = $(this).val();
			        ph = $(this).attr('placeholder');
			        if (va == ph) {
			            $(this).val('');
			        }
			    }).blur(function() {
			        va = $(this).val();
			        ph = $(this).attr('placeholder');
			        if (va == '') {
			            $(this).val(ph);
			        }
			    });
			}
		};

		$scope.hideDisclaimer = true;
		$scope.formData = {
			zipcode: '',
			adults: [],
			children: 0,
			income: ''
		};

		$scope.status = {
		    isDisabled: true,
		    submitted: false,
		    first: {
		    	open: true,
		    	edit: true,
		    	success: false,
		    	error: false,
		    	errorIncorrectZipCode: false
		    },
		    second: {
		    	open: false,
		    	edit: false,
		    	success: false,
		    	error: false

		    },
		    third: {
		    	open: true,
		    	edit: true,
		    	success: false,
		    	error: false
		    }
		};

		$scope.stateHandler = function(index) {
			switch(index) {
				case 0:
					$scope.status.first.open = true;
				    $scope.status.first.edit = true;
				    $scope.status.first.success = false;
				    $scope.status.first.error = false;
				    $scope.status.first.errorIncorrectZipCode = false;
				    $scope.status.second.open = false;
		    		$scope.status.second.edit = false;
				    $scope.status.third.open = false;
		    		$scope.status.third.edit = false;
					break;
				case 1:
					$scope.status.first.open = false;
				    $scope.status.first.edit = false;
				    $scope.status.second.open = true;
		    		$scope.status.second.edit = true;
				    $scope.status.second.success = false;
				    $scope.status.second.error = false;
				    $scope.status.third.open = false;
		    		$scope.status.third.edit = false;
					break;
				case 2:
					$scope.status.first.open = false;
				    $scope.status.first.edit = false;
				    $scope.status.second.open = false;
		    		$scope.status.second.edit = false;
				    $scope.status.third.open = true;
		    		$scope.status.third.edit = true;
				    $scope.status.third.success = false;
				    $scope.status.third.error = false;
					break;
				case 3:
					$scope.status.first.open = false;
				    $scope.status.first.edit = false;
				    $scope.status.second.open = false;
		    		$scope.status.second.edit = false;
				    $scope.status.third.open = false;
		    		$scope.status.third.edit = false;
					break;
				default:
					break;
			}
		};

		$scope.setZIPCode = function(zipcode, county, countyFormatted) {
			profilestore.setProperty('zipcode', zipcode);
			profilestore.setProperty('county', county);
			profilestore.setProperty('county-formatted', countyFormatted);
			$scope.formData.zipcode = $scope.profilestore.getProperty('zipcode');
			$scope.formData.county = $scope.profilestore.getProperty('county');
			$scope.formData.countyFormatted = $scope.profilestore.getProperty('county-formatted');
			$scope.status.first.success = true;
			$scope.stateHandler(1);
		};

		$scope.enteringZIPCode = function() {
			$scope.status.first.success = false;
			$scope.status.first.error = false;
			$scope.formData.hasMultipleCounties = false;
		};

		$scope.enteringAdultAge = function() {
			$scope.status.second.success = false;
			$scope.status.second.error = false;
		};

		$scope.enteringIncome = function() {
			$scope.status.third.success = false;
			$scope.status.third.error = false;
		};

		$scope.zipCodeSuccessHandler = function(counties) {
			if(counties.length === 0) {
				$scope.status.first.error = true;
				$scope.status.first.errorIncorrectZipCode = true;
			} else if(counties.length === 1) {
				$scope.setZIPCode($scope.formData.zipcode, counties[0].county, counties[0].countyFormatted);
			} else {
				$scope.formData.hasMultipleCounties = true;
				$scope.formData.counties = counties;
			}
		};

		$scope.selectedCounty = function() {
			$scope.setZIPCode($scope.formData.zipcode, $scope.formData.selectedCounty.county, $scope.formData.selectedCounty.countyFormatted);
		};

		$scope.submitZIPCode = function() {
			if(!$scope.formData.zipcode) {
				$scope.status.first.error = true;
				return;
			}
			
			$http.get('/content/dam/public/shared/documents/premiumzips/counties.json').
				success(function(data, status, headers, config) {
					$scope.status.first.error = false;
					var countyList = [];
	            	for(var county in data) {
					    if(data[county].zipcode.indexOf($scope.formData.zipcode) > -1) {
					        countyList[county] = data[county].title;
					        countyList.push({'county': county, 'countyFormatted': data[county].title});
					    }
					}
					$scope.zipCodeSuccessHandler(countyList);
				}).
				error(function(data, status, headers, config) {
					$scope.status.first.error = true;
				});
		};

		$scope.getNumber = function(num) {
		    return new Array(num);   
		};

		$scope.addChild = function() {
			if($scope.formData.children + $scope.formData.adults.length < 8) {
				$scope.formData.children++;
			}
		};

		$scope.addAdult = function() {
			if($scope.formData.children + $scope.formData.adults.length < 8) {
				$scope.formData.adults.push({'age':''});
				$timeout($scope.fixPlaceholderIE, 0);
			}
		};

		$scope.removeChild = function() {
			if($scope.formData.children > 0) {
				$scope.formData.children--;
			}
		};

		$scope.removeAdult = function(index) {
			$scope.formData.adults.splice(index,1);
		};

		$scope.submitFamily = function() {
			var hasErrors = false;
			if($scope.formData.adults.length + $scope.formData.children === 0) {
				$scope.status.second.error = true;
				hasErrors = true;
			}

			for(var i = 0; i < $scope.formData.adults.length; i++) {
				var adult = $scope.formData.adults[i];
				if(!$.isNumeric(adult.age) || parseInt(adult.age) < 21 || parseInt(adult.age) > 64) {
					$scope.status.second.error = true;
					adult.error = true;
					hasErrors = true;
				}
			}
			if(hasErrors) return;
			$scope.status.second.success = true;
			$scope.stateHandler(2);
		};

		$scope.submitIncome = function() {
			var hasErrors = false;
			if($scope.formData.income) {
				$scope.formData.income = $scope.formData.income.replace('$', '').replace(',', '');
			}

			if(!$.isNumeric($scope.formData.income)) {
				$scope.status.third.error = true;
				hasErrors = true;
			}
			if(hasErrors) return;
			$scope.status.third.success = true;
			$scope.stateHandler(3);

			$http.get('/content/dam/public/tools/js/subsidy-county-bases.json').
				success(function(data, status, headers, config) {
					var ages = [];
					for(var i = 0; i < $scope.formData.adults.length; i++) {
						ages.push($scope.formData.adults[i].age);
					}

					for(var i = 0; i < $scope.formData.children; i++) {
						ages.push('20');
					}
					var basePremium = data.countyBase[0][$scope.formData.countyFormatted];

					$scope.subsidy = BCBSM.SubsidyEstimator.estimatePrice(ages, $scope.formData.income, basePremium);
					$scope.status.submitted = true;
				}).
				error(function(data, status, headers, config) {
					$scope.status.first.error = true;
				});
		};

		$scope.goBack = function() {
			$scope.status.submitted = false;
			$scope.stateHandler(2);
		};

		$scope.reset = function() {
			$scope.hideDisclaimer = true;
			$scope.formData = {
				zipcode: '',
				adults: [],
				children: 0,
				income: ''
			};

			$scope.status = {
			    isDisabled: true,
			    submitted: false,
			    first: {
			    	open: true,
			    	edit: true,
			    	success: false,
			    	error: false,
		    		errorIncorrectZipCode: false
			    },
			    second: {
			    	open: false,
			    	edit: false,
			    	success: false,
			    	error: false

			    },
			    third: {
			    	open: true,
			    	edit: true,
			    	success: false,
			    	error: false
			    }
			};

			$scope.formData.zipcode = $scope.profilestore.getProperty('zipcode');
			$scope.formData.county = $scope.profilestore.getProperty('county');
			$scope.formData.countyFormatted = $scope.profilestore.getProperty('county-formatted');

			if($scope.formData.zipcode && $scope.formData.county && $scope.formData.countyFormatted) {
				$scope.status.first.success = true;
				$scope.stateHandler(1);
			} else {
				$scope.stateHandler(0);
			}
		};

		$scope.viewPlans = function() {
			//except of the screen with two subsidies, we might want to link them here:
			///content/public/en/index/plans/michigan-health-insurance/silver.html

			window.location = '/content/public/en/index/plans/michigan-health-insurance.html';
		};
	}
]);

angular.module('bcbsmApp').controller('LearningEventsController', ['$scope', '$http',
	function($scope, $http) {
		
		$scope.tabs = [
			{ title:'In-person seminars', content:'Dynamic content 1' },
			{ title:'Conference calls', content:'Dynamic content 2' }
		];

		$scope.init = function(vars) {

			$(document).ready(function(){
				$('#myTab a').click(function (e) {
				  e.preventDefault()
				  $(this).tab('show');
				});
				
			});
			
			$scope.loading = true;
			$scope.activeSeminars = 0;
			$scope.activeConferenceCalls = 0;
			var pathToData = (vars.pathToData) ? vars.pathToData : '/content/dam/public/shared/documents/events/learningEvents.json';
			$http.get(pathToData).
				success(function(data) {
					$scope.loading = false;
					$scope.events = {'seminars': data['seminars'], 'conference_calls': data['conference_calls']};
					
					
					var today = new Date();
					today.setDate(today.getDate()-1);
					
					for(var i = 0; i < $scope.events.seminars.length; i++) {
						var evt = $scope.events.seminars[i];
						var evtDate = new Date(evt.date);

						if((today.valueOf()/1000) > (evtDate.valueOf()/1000)) {
							$scope.events.seminars[i].expired = true;
						} else {
							$scope.activeSeminars++;
						}

						$scope.events.seminars[i].dateMonth = evtDate.getMonth();
						$scope.events.seminars[i].dateDay = evtDate.getDate();
					}

					for(var i = 0; i < $scope.events.conference_calls.length; i++) {
						var evt = $scope.events.conference_calls[i];
						var evtDate = new Date(evt.date);
						if(today.valueOf() > evtDate.valueOf()) {
							$scope.events.conference_calls[i].expired = true;
						} else {
							$scope.activeConferenceCalls++;
						}

						$scope.events.conference_calls[i].dateMonth = evtDate.getMonth();
						$scope.events.conference_calls[i].dateDay = evtDate.getDate();
					}
					
				}).
				error(function() {
					$scope.loading = false;

				});
		};
	}
]);

angular.module('bcbsmApp').controller('learningEventsChildController',['$scope',
	function($scope){
		$scope.dynamicDate =  function(){
			var setDate = new Date();
			var month = setDate.getMonth();
			var day = setDate.getDate();
			if((month == 9 && day >= 1) || (month == 1 && day <= 14)){
				$('.extendedTime').show();
				$('.regularTime').hide();
			}
			else if(month == 10 || month == 11 || month == 0){
				$('.extendedTime').show();
				$('.regularTime').hide();
			}
			else{ 
				$('.regularTime').show();
				$('.extendedTime').hide();
			}
		}
		$scope.dynamicDate();
	}
]);