/* Retail R2 Functions
- Fixed plan listing title. 10/31/2014 0727 -js
*/

// This allows the "placeholder" attribute to work in older browsers
(function ($) {
    df1 = $.Deferred();

	$(document).ready(function () {
        
        CQ_Analytics.ClientContextUtils.onStoreInitialized("profile", function(event) {
            profilestore = CQ_Analytics.ClientContextMgr.getRegisteredStore("profile");
            if(profilestore!== null){
                df1.resolve();
            }
        });
        
		// IE8 hasOwnProperty fix
		window.hasOwnProperty = window.hasOwnProperty || Object.prototype.hasOwnProperty;
        
     $('[down-time].outage').each(function(){
            var downTime = $(this).attr('down-time');

            if (parseInt(downTime) < new Date().getTime()){
                $(this).hide();
            }   
    });

		// IE8 indexOf fix
		if (!Array.prototype.indexOf) {
			Array.prototype.indexOf = function (searchElement /*, fromIndex */) {
				"use strict";
				if (this === null) {
					throw new TypeError();
				}
				var t = Object(this),
                    len = t.length > 0,
                    n = 0;
				if (len === 0) {
					return -1;
				}
				
				if (arguments.length > 1) {
					n = Number(arguments[1]);
					if (n !== n) { // shortcut for verifying if it's NaN
						n = 0;
					} else if (n !== 0 && n !== Infinity && n !== -Infinity) {
						n = (n > 0 || -1) * Math.floor(Math.abs(n));
					}
				}
				if (n >= len) {
					return -1;
				}
				var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
				for (; k < len; k++) {
					if (k in t && t[k] === searchElement) {
						return k;
					}
				}
				return -1;
			}
		}
	});

})(jQuery);

/* ZIP CODE FUNCTIONALITY */
(function ($) {

	profilestore = null;
	
	var updatedZip = false;
	var updatedCounty = false;
	var updatedCountyFormatted = false;
    
    
    

	$(document).ready(function() {
		if(profilestore==null) return;

		profilestore.addListener("update", function(store, property) {
			if(property === "zipcode") {
				updatedZip = true;
			} else if(property === "county") {
				updatedCounty = true;
			} else if(property === "county-formatted") {
				updatedCountyFormatted = true;
			}
			
			if(updatedZip && updatedCounty && updatedCountyFormatted) {
				updatedZip = false;
				updatedCounty = false;
				updatedCountyFormatted = false;
				updatePlanPricing();
			}
		});

		updatePlanPricing();
	});

	setZipCodeProperties = function(zipcode, county, countyFormatted) {
		profilestore.setProperty('zipcode', zipcode);
		profilestore.setProperty('county', county);
		profilestore.setProperty('county-formatted', countyFormatted);
		updatePlanPricing();
	};

	zipCodeInit = function(randomId, zipcodeSetCallback, zipcodeEmptyCallback) {
		if(profilestore && $.isFunction( profilestore.getProperty )) {
			var zipcode = profilestore.getProperty("zipcode");
			var county = profilestore.getProperty("county");
			var countyFormatted = profilestore.getProperty("county-formatted");
			if(zipcode && county && countyFormatted) {
				$('#'+randomId+' .zipcode-gather').hide();
				$('#'+randomId+' .zipcode-resolved').show();
				$('#'+randomId+' .zipcode-not-found').hide();
				$('#'+randomId+' .features-zip.gather').hide();
				$('#'+randomId+' .features-zip.resolved').show();
				if(zipcodeSetCallback) zipcodeSetCallback();
				return;
			}
		}

		$('#'+randomId+' .zipcode-gather').show();
		$('#'+randomId+' .zipcode-resolved').hide();
		$('#'+randomId+' .zipcode-not-found').hide();
		$('#'+randomId+' .features-zip.gather').show();
		$('#'+randomId+' .features-zip.resolved').hide();
		if(zipcodeEmptyCallback) zipcodeEmptyCallback();
	};

	countyLookup = function(zipcode, successCallback, errorCallback) {
        var jsonPath = "/content/dam/public/shared/documents/premiumzips/counties.json";
        $.ajax(jsonPath, {
            dataType: "json",
            success: function(rawData, status, xhr) {
            	var countyList = [];
            	for(county in rawData) {
				    if(rawData[county].zipcode.indexOf(zipcode) > -1) {
				        countyList[county] = rawData[county].title;
				        countyList.length++;
				    }
				}
            	successCallback(countyList);
            },
            error: function(xhr, status, err) {
            	if(errorCallback) {
	        		errorCallback(err);
	         	}
            }
        });
	};

	getPlanPricing = function(county, category, planname, planyear, successCallback, errorCallback, randomId, excludeFromZip, zipcode) {
		var jsonPath = "/content/dam/public/shared/documents/premiumzips/ibu-premiums.json";
		var curPage = window.location.pathname;
		var hasSegments = false;
		if(curPage.substring(0,9) === "/medicare" || curPage.substring(0,28) === "/content/microsites/medicare") {
			jsonPath = "/content/dam/public/shared/documents/premiumzips/medicare-premiums.json";
			hasSegments = true;
		}

		$('#'+randomId+' .price').html('<i class="icon-spin icon-refresh icon-large64"></i>');

        $.ajax(jsonPath, {
            dataType: "json",
            success: function(rawData, status, xhr) {
            	var retObj = [];
            	retObj["randomId"] = randomId;
            	retObj["excludeFromZip"] = excludeFromZip;

            	if(!rawData.hasOwnProperty(category)) {
		            errorCallback('Response does not have property: '+category);
		            return;
		        }
		        if(!rawData[category].hasOwnProperty(planname)) {
		            errorCallback('Response does not have property: '+planname);
		            return;
		        }
		        if(!rawData[category][planname].hasOwnProperty(planyear)) {
		            errorCallback('Response does not have property: '+planyear);
		            return;
		        }

		        if(hasSegments) {
			        for(segment in rawData[category][planname][planyear]) {
			        	if(segment.substring(0, 8) === "segment_") {
			        		if(rawData[category][planname][planyear][segment]['counties'].indexOf(county) > -1) {
			        			if ((county === "St. Joseph") && rawData[category][planname][planyear][segment]['excluded_zips'].indexOf(zipcode) > -1) {
			        				// do nothing as plan needs to be excluded for St Joseph for the selected zipcode.
			        			}
			        			else {
			        					retObj['drug_premium'] = rawData[category][planname][planyear][segment]['drug_premium'];
			        					retObj['part_d_premium'] = rawData[category][planname][planyear][segment]['part_d_premium'];
			        					retObj['medical_premium'] = rawData[category][planname][planyear][segment]['medical_premium'];
			        					retObj['total_premium'] = rawData[category][planname][planyear][segment]['total_premium'];
			        					retObj['exists'] = true;
			        			}







			        			
			        		}
			        	}
			        }
			    } else {
			    	if(rawData[category][planname][planyear]['counties'].indexOf(county) > -1) {
	        			retObj['total_premium'] = '';
	        			retObj['exists'] = true;
	        		}
			    }
		        successCallback(retObj);
            },
            error: function(xhr, status, err) {
            	if(errorCallback) {
	        		errorCallback(err);
	         	}
            }
        });
	};

	createZipCodeModal = function(zipcode, counties) {
		var bodyText = "<p>Not all our plans are available in all Michigan counties. If you enter your ZIP code, we\’ll only show plans you can buy.</p>";
		var buttonText = "View Plans";
		var curPage = window.location.pathname;
		if(curPage.substring(0,9) === "/medicare" || curPage.substring(0,28) === "/content/microsites/medicare") {
			bodyText = "<p>The price for some of our Medicare Advantage plans is based on where you live. If you give us your ZIP code, we\'ll show you the plans available in your area and how much they cost.</p>";
			buttonText = "View Pricing";
		}
		
		var html =
		"<div id=\"enterZipModal\" class=\"modal fade\">" +
	      "<div class=\"modal-header\">" +
	        "<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>" +
	        "<h4 class=\"modal-title\">Where do you live?</h4>" +
	      "</div>" +
	      "<div class=\"modal-body\">" +
	      	bodyText +
	      	"<p>We don't store this information and you can change it at any time.</p>" +
	        "<div class=\"controls\">";
	        if(zipcode) {
	        html += "<input class=\"zipcode-input\" type=\"text\" name=\"zipcode\" value=\""+zipcode+"\" placeholder=\"Enter ZIP code\">";
	        } else {
	        html += "<input class=\"zipcode-input\" type=\"text\" name=\"zipcode\" placeholder=\"Enter ZIP code\">";
	        }
	        html += "<button id=\"submitZipCode\" type=\"button\" class=\"btn-zipcode-submit has-spinner\">" +
					    "<span class=\"spinner\"><i class=\"icon-spin icon-white icon-refresh\"></i></span>" +
					    buttonText +
					"</button>" +
	        "</div>" +
	      "</div>" +
		"</div>";

		$('body').prepend(html);
		if(counties) {
			insertCountySelections(zipcode, counties);
		}
		$('#enterZipModal').modal();
	};

	insertCountySelections = function(zipcode, counties) {
		var html = "<div class=\"county-options\">";
		html += "<p>Your ZIP code is used in more than one county. Which one do you live in?</p>";
		for(var key in counties) {
			if(typeof counties[key] !== 'function') {
				html += "<label><input type=\"radio\" name=\"county\" value=\""+zipcode+":"+key+":"+counties[key]+"\">"+counties[key]+"</label>";
			}
		}
		html += "</div>";
		$('#enterZipModal .modal-body .county-options').remove();
		$('#enterZipModal .modal-body').append(html);
	};

	var updatePlanListingTitle = function() {
		$('.planlistingtitle .alert').remove()
		var showCount = 0;
		var hideCount = 0;
		var buckets = $('.plan_bucket');
		var tHeaders = $('table.plan_compare th');

		if(buckets.length > 0) {
			for(var i = 0; i < buckets.length; i++) {
			 	if($(buckets[i]).css('display') === 'none') {
			 		hideCount++;
			 	}
			}
			showCount = buckets.length - hideCount;
		} else if(tHeaders.length > 0) {
			for(var i = 0; i < tHeaders.length; i++) {
			 	if($(tHeaders[i]).css('display') === 'none') {
			 		hideCount++;
			 	}
			}
			showCount = tHeaders.length - hideCount - 1;// To compensate for the initial blank th;
		}

		(showCount === 1) ? $('.plans_number').text('('+showCount+' plan)') : $('.plans_number').text('('+showCount+' plans)');

		if(hideCount > 0) {
			if(hideCount === 1) {
				$('.planlistingtitle .plans_number').after('<div class="alert alert-warning">'+hideCount+' plan not available in '+profilestore.getProperty('county-formatted')+' County has been hidden from view. <a href="#" class="change-zip">(Change)</a></div>');
			} else {
				$('.planlistingtitle .plans_number').after('<div class="alert alert-warning">'+hideCount+' plans not available in '+profilestore.getProperty('county-formatted')+' County have been hidden from view. <a href="#" class="change-zip">(Change)</a></div>');
			}
		}else{
			if(profilestore.getProperty('county-formatted')){//Only display if a zipcode has been entered.
				if((/plans\/dental-insurance-michigan\.html/ig).test(window.location.pathname)){//Dental and vision
					$('.planlistingtitle .plans_number').after('<div class="alert alert-warning">All of our dental and vision plans are available in '+profilestore.getProperty('county-formatted')+' County. <a href="#" class="change-zip">(Change)</a></div>');
				}else if((/plans\/michigan-health-insurance\/catastrophic\.html/ig).test(window.location.pathname)){//catastrophic
					$('.planlistingtitle .plans_number').after('<div class="alert alert-warning">Both of our catastrophic plans are available in '+profilestore.getProperty('county-formatted')+' County. <a href="#" class="change-zip">(Change)</a></div>');
				}else if((/plans\/michigan-health-insurance\/platinum\.html/ig).test(window.location.pathname)){//Platinum
					$('.planlistingtitle .plans_number').after('<div class="alert alert-warning">Our platinum plan is available in '+profilestore.getProperty('county-formatted')+' County. <a href="#" class="change-zip">(Change)</a></div>');
				}
			}	
		}
	};

	var planPricingSuccess = function(response) {
		if(!response.exists) {
			var tds = $('.plan_zipcode td');
			if(tds) {
				var idx = 0;
				for(var key in tds) {
					idx++;
					if(tds[key].id == response.randomId && !response.excludeFromZip) {
						$('table.plan_compare').find('tr th:nth-child(' + idx + ')').hide();
						$('table.plan_compare').find('tr td:nth-child(' + idx + ')').hide();
						break;
					}
				}
			}

			if(!response.nodeExists && !response.excludeFromZip) {
				$('#'+response.randomId).hide();
				$('.'+response.randomId).hide();
				updatePlanListingTitle();
				return;
			} else if(response.excludeFromZip && $('#'+response.randomId+' .zipcode-not-found').length != 0) {
				$('#'+response.randomId+' .zipcode-not-found').show();
				$('#'+response.randomId+' .zipcode-resolved').hide();
			} else if(response.excludeFromZip && $('.'+response.randomId+' .zipcode-not-found').length != 0) {
				$('.'+response.randomId+' .zipcode-not-found').show();
				$('.'+response.randomId+' .zipcode-resolved').hide();
			}
			$('#'+response.randomId+' .price').text(response.total_premium);
		} else {
				$('.'+response.randomId+' .price').text(response.total_premium);
				$('.'+response.randomId+' .price').removeClass('nullPrice');
				$('#'+response.randomId+' .price').text(response.total_premium);
				$('#'+response.randomId+' .price').removeClass('nullPrice');
			
		}
		
		updatePlanListingTitle();
	};

	var planPricingError = function(response) {
		//console.log(response.statusText)
	};

	updatePlanPricing = function() {
		$('#enterZipModal').modal('hide');

		var zipcode = profilestore.getProperty("zipcode");
		var county = profilestore.getProperty("county");
		var countyFormatted = profilestore.getProperty("county-formatted");


		var zipInit = function(zipcodeInfo) {
			if(zipcodeInfo) {
				var attrs = zipcodeInfo.split(',');
				var UID = attrs[0];
				var planCategory = attrs[1];
				var planName = attrs[2];
				var planYear = attrs[3];
				var excludeFromZip = (attrs[4] === 'true');;

				zipCodeInit(UID, getPlanPricing(profilestore.getProperty("county-formatted"), planCategory, planName, planYear, planPricingSuccess, planPricingError, UID, excludeFromZip, zipcode));

				$('.zipcode-property').html(profilestore.getProperty("zipcode")+' (change)');
				$('.zipcode-gather').hide();
				$('.zipcode-resolved').show();
			}
		}

		if(zipcode && county && countyFormatted) {
			if($('table.plan_compare').length != 0) {
				var tHeaders = $('table.plan_compare th');
				$('table.plan_compare').find('tr th').show();
				$('table.plan_compare').find('tr td').show();

				for(var x = 0; x < tHeaders.length; x++) {
					zipInit($(tHeaders[x]).attr('zipcode-info'));
				}
			} else if($('.listplanbucket').length != 0) {
				var planBucket = $('.plan_bucket');
				$('.plan_bucket').show();

				for(var x = 0; x < planBucket.length; x++) {
					zipInit($(planBucket[x]).attr('zipcode-info'));
				}
			} else if($('#overview-price').length != 0) {
				zipInit($('#overview-price').attr('zipcode-info'));
			}else if($('.overview-price').length != 0) {
				zipInit($('.overview-price').attr('zipcode-info'));
			}
		} else {
			updatePlanListingTitle();
		}
	};

	getCounties = function(zipcode, notFromModal) {
		if(!zipcode) return;

		$('#submitZipCode').addClass('active');
		$('#zipCodeSubmitButton').addClass('active');

		countyLookup(zipcode, 
		  	function(success) {
		  		$('#submitZipCode').removeClass('active');
				$('#zipCodeSubmitButton').removeClass('active');

			   	if(success.length === 1) {
			   		$('#enterZipModal .modal-body .alert').remove();
					for (var key in success) {
						setZipCodeProperties(zipcode, key, success[key]);
						return;
					}
				} else if(success.length > 1) {
					if(notFromModal) {
						createZipCodeModal(zipcode, success);
					} else {
						$('#enterZipModal .modal-body .alert').remove();
						insertCountySelections(zipcode, success);
					}
				} else {
					if($('#enterZipModal').length === 0) {
						createZipCodeModal(zipcode);
					}
					$('#enterZipModal .modal-body .alert').remove();
					var errorMsg = '<div class="alert alert-warning">We don\'t have any plans available in that ZIP code. If you think you entered the wrong ZIP code, you can try again.</div>';
					$('#enterZipModal .modal-body').prepend(errorMsg);
				}
   			},
   			function(error) {
		  		$('#submitZipCode').removeClass('active');
				$('#zipCodeSubmitButton').removeClass('active');

   				if($('#enterZipModal').length === 0) {
					createZipCodeModal(zipcode, error);
				}
				$('#enterZipModal .modal-body .alert').remove();
				var errorMsg = '<div class="alert alert-warning">We don\'t have any plans available in that ZIP code. If you think you entered the wrong ZIP code, you can try again.</div>';
				$('#enterZipModal .modal-body').prepend(errorMsg);
   			});
	};

	var initOverviewPrice = false;
	$(document).on('loadComplete', '#tabContent', function(event) {
		if(($('#plan-table-container').length > 0 || $('.listplanbucket').length > 0) || !initOverviewPrice && $('.overview-table #overview-price').length > 0) {
			if($('.overview-table #overview-price').length > 0) {
				initOverviewPrice = true; // Only allow it to be initialized once
			}
			updatePlanPricing();
		}
		if($('body.medicare').length>0){
			externalLinkHandlerMedicare();
			dynamicDate();
			updatePlanPricing();
		}
		
	});

	// Handler for clicking the Change Zip text
	$(document).on('click', '.change-zip', function(event) {
		event.preventDefault();
		createZipCodeModal();
	});

	// Handler for clicking Submit on the zipcode modal
	$(document).on('click', '#submitZipCode', function(event) {
		event.preventDefault();
		var zipcode = $.trim($("#enterZipModal input:text[name='zipcode']").val());
		getCounties(zipcode);
	});

	$(document).on('click', '#zipCodeSubmitButton', function(event) {
	    event.preventDefault();
	    var failure = function(err) {
			log("Unable to retrive data "+err);
	   };
	   
	   var zipcode = $.trim($('#zipcode').val());
	   if(!zipcode) return;
	   getCounties(zipcode, true);
	});

	// Handler for selecting a county on the zipcode modal
	$(document).on('click', '#enterZipModal .county-options input:radio[name="county"]', function(one, two) {
		var info = $("input:radio[name='county']:checked").val().split(":");
		setZipCodeProperties(info[0], info[1], info[2]);
	});


	$(document).on('keypress', '#zipcode', function (event) {
		if(event.which == '13') {
			event.preventDefault();

			var zipcode = $.trim($('#zipcode').val());
			if(!zipcode) {
				return;
			}

			getCounties(zipcode, true);
		}
	});

	$(document).on('keypress', '#enterZipModal .zipcode-input', function (event) {
		if(event.which == '13') {
			event.preventDefault();

			var zipcode = $.trim($("#enterZipModal input:text[name='zipcode']").val());
			if(!zipcode) {
				return;
			}

			getCounties(zipcode);
		}
	});

	 /*
    BCBSM External Link Handler Script - MEDICARE
    Updated, added currentHost variable to detect current host 12/14/2012 -cmc
    */
     externalLinkHandlerMedicare = function () {
        var currentHost = window.location.host;
        var jsonarray = [];
        var bcbsmArray = [currentHost];
        var json =  $.getJSON("/content/dam/public/shared/documents/externalModalMedicare.json", function(data) {
            $.each(data.aModalLinksMedicare, function(value) {
                    jsonarray[value+1] = data.aModalLinksMedicare[value];
                    return jsonarray;    
            });
            $.each(data.aModalLinks, function(value){
            	bcbsmArray[value+1] = data.aModalLinks[value];
                return bcbsmArray; 
            });
            var message =
                "Please note that you\'re leaving the Medicare-specific section of our website.";

            var extMessage =
                "Please note that you\'re leaving the Blue Cross Blue Shield of Michigan website. \n\n" +
                "While we recommend this site, we aren\'t responsible for its content. It may have different terms, conditions and privacy policies that you\'ll need to follow."; 

            $('a').removeClass('external').removeClass('internal').removeClass('bcbsmLink');
            $('a').each(function () {
                var rInternalLinkCheck = regExpBuilder(jsonarray);
                var bcbsmLinkCheck = regExpBuilder(bcbsmArray);
                // console.log(rInternalLinkCheck);
                if (rInternalLinkCheck.test(this.href)) {
                  $(this).removeClass("external").removeClass('bcbsmLink').addClass("internal"); //Add external class to external links                  
                } else if(bcbsmLinkCheck.test(this.href)){
                	$(this).removeClass("external").removeClass('internal').addClass("bcbsmLink");
                } else {
                  $(this).removeClass("internal").addClass("external");
                }
            });

            //For manually inserted exceptions, remove class just added
            $("a.exception").removeClass("external");

            //click event for all links with the external class just added  
            $('a.external').off().on('click', function (event) {
              event.preventDefault();
              event.stopPropagation();
              var answerOk = confirm(extMessage);
              if (answerOk) {
                window.open(this.href, '_blank');
              }
            });

            $('a.bcbsmLink').off().on('click', function (event) {
              event.preventDefault();
              event.stopPropagation();
              var answerOk = confirm(message);
              if (answerOk) {
                window.open(this.href, '_blank');
              }
            });
        });
    }
	
	$(document).ready(function(){
		if($('body.medicare').length>0){
			externalLinkHandlerMedicare();
		}
		/* Initiate dynamic date function medicare contact us*/
		if($('body.medicare')){
			if($("table").hasClass('contact_us_container')){
				dynamicDate();
			}
			
		}
		
	});

	$(document).on('click', '.accordion-toggle', function() {
		if($('body.medicare').length>0){
			externalLinkHandlerMedicare();
		}
	});
	
	/*dynamic date for Medicare contact us*/
	
	var dynamicDate = function(){
		var setDate = new Date();
		var month = setDate.getMonth();
		var day = setDate.getDate();
		if((month == 9 && day >= 1) || (month == 1 && day <= 14)){
			$('.extendedTime').show();
		}
		else if(month == 10 || month == 11 || month == 0){
			$('.extendedTime').show();
		}
		else{ 
			$('.regularTime').show();
		}
	}
	// initiate dynamic date on pages with accordions
	
})(jQuery);

