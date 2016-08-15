// This Subsidy Estimate calculator class is a JavaScript implementation of the
// provided estimator spreadsheet. Many of the calculated cells in the spreadsheet
// have 1:1 correlations with functions contained within this class. This aided in
// development, debugging, and in replicating the spreadsheet's flow of data.
// The estimator was designed to be front-end agnostic. With that in mind, a
// certain set of input are required to compute the estiamte. These are:
//
// ages: An array of ages of the covered individuals. This array corresponds to
//       spreadsheet cells 'Income base'!F2-F13 and 'Income base'!I2-I13.
//       ie. [33, 30, 13, 10] represents a family of four: two adults ages 33
//                            and 30, and two children ages 13 and 10
// income: The total family income, represented in the spreadsheet in cell
//         'Income base'!C4
// basePremium: The base premium price to use during the esimation calculation.
//              This varies based on the county the user is in and is therefore
//              provided by the front-end.
//
// In order to calculate eligibility and estimated prices, the front-end needs
// to call
//          BCBSM.SubsidyEstimator.estimatePrice(ages, income, basePremium);
// The result is a JSON object with the following attributes:
//
// medicare: true if the user qualifies for medicare, false otherwise.
// eligible: true if the user qualifies for a subsidy, false otherwise.
// oopMaxReduction: true if the user qualifies for an out-of-pocket maximum
//                  reduction, false otherwise
// totalPremium: The calculated total premium, as represented in the
//               spreadsheet in cell 'Income base'!C16.
// priceToPurchaser: The calculated price to the purchaser, as represented
//                   in the spreadsheet in cell 'Income base'!C18.
// premiumTaxCredit: The user's calculated premium tax creditm as represented
//                   in the spreadsheet in cell 'Income base'!C17.
// monthlyPremiumTaxCredit: The premiumTaxCredit above, divided by 12 to
//                          determine the monthly tax credit.

var BCBSM = BCBSM || {};
BCBSM.SubsidyEstimator = {

	// This object defines the ranges for the FPL buckets
	// The initialPer and finalPer values are pulled directly from the
	// spreadsheet and are used to calculate the user's "applicable percentage."
	// A user is placed into one of the 7 buckets by calculating their Federal
	// Poverty Level and comparing it to the defined percentages as follows:
	// Bucket A: 0% <= FPL < 133%
	// Bucket B: 133% <= FPL < 150%
	// Bucket C: 150% <= FPL < 200%
	// Bucket D: 200% <= FPL <= 250%
	// Bucket E: 250% < FPL < 300%
	// Bucket F: 300% <= FPL < 400%
	// Bucket G: 400.01% <= FPL
	FPLBuckets: {
		'A': {
			'fplLow': 0,
			'fplHigh': 1.33,
			'initialPer': .0203,
			'finalPer': .0203
		},
		'B': {
			'fplLow': 1.33,
			'fplHigh': 1.50,
			'initialPer': .0305,
			'finalPer': .0407
		},
		'C': {
			'fplLow': 1.50,
			'fplHigh': 2.00,
			'initialPer': .0407,
			'finalPer': .0641
		},
		'D': {
			'fplLow': 2.00,
			'fplHigh': 2.50,
			'initialPer': .0641,
			'finalPer': .0818
    	},
		'E': {
			'fplLow': 2.50,
			'fplHigh': 3.00,
			'initialPer': .0818,
			'finalPer': .0966
		},
		'F': {
			'fplLow': 3.00,
			'fplHigh': 4.00,
			'initialPer': .0966,
			'finalPer': .0966
		},
		'G': {
			'fplLow': 4.01,
			'fplHigh': 999999,
			'initialPer': 1,
			'finalPer': 1
		}
	},

	// This list of age factors is pulled directly from the spreadsheet
    ageFactors: {
        '0': '0.635',
        '1': '0.635',
        '2': '0.635',
        '3': '0.635',
        '4': '0.635',
        '5': '0.635',
        '6': '0.635',
        '7': '0.635',
        '8': '0.635',
        '9': '0.635',
        '10': '0.635',
        '11': '0.635',
        '12': '0.635',
        '13': '0.635',
        '14': '0.635',
        '15': '0.635',
        '16': '0.635',
        '17': '0.635',
        '18': '0.635',
        '19': '0.635',
        '20': '0.635',
        '21': '1',
        '22': '1',
        '23': '1',
        '24': '1',
        '25': '1.004',
        '26': '1.024',
        '27': '1.048',
        '28': '1.087',
        '29': '1.119',
        '30': '1.135',
        '31': '1.159',
        '32': '1.183',
        '33': '1.198',
        '34': '1.214',
        '35': '1.222',
        '36': '1.23',
        '37': '1.238',
        '38': '1.246',
        '39': '1.262',
        '40': '1.278',
        '41': '1.302',
        '42': '1.325',
        '43': '1.357',
        '44': '1.397',
        '45': '1.444',
        '46': '1.5',
        '47': '1.563',
        '48': '1.635',
        '49': '1.706',
        '50': '1.786',
        '51': '1.865',
        '52': '1.952',
        '53': '2.04',
        '54': '2.135',
        '55': '2.23',
        '56': '2.333',
        '57': '2.437',
        '58': '2.548',
        '59': '2.603',
        '60': '2.714',
        '61': '2.81',
        '62': '2.873',
        '63': '2.952',
        '64': '3'
    },

	// This function takes the user's family size and their total family income
	// in order to calculate their Federal Poverty Level. This FPL values is
	// returned from this function.
	getFPL: function(famSize, income) {
		var firstPerson = 11770;
		var additionalPerson = 4160;
		var fplCalculated = income / (firstPerson + ((famSize - 1) * additionalPerson));
		
		fplCalculated = fplCalculated * 100;		

		if (fplCalculated >= 998.99) {
			return(9.99);
		} else if (fplCalculated > 400 && fplCalculated < 998.99) {
			return((Math.ceil(fplCalculated))/100);
		} else if (fplCalculated > 399 && fplCalculated <= 400) {
			return(3.99);
		} else if (fplCalculated < 100.00) {
			return ((Math.floor(fplCalculated))/100);
		} else {
			return ((Math.round(fplCalculated))/100);
		}


		//BRS Can remove if above works
		//fplCalculated = fplCalculated * 100;
		//var fpl = Math.round(fplCalculated);
		//fpl = fpl/100;
		//return fpl;
	},

	// This is a utility function which takes the user's Federal Poverty Level
	// and figures out which bucket they fall in. The name of the bucket (A, B,
	// C, etc.) is returned.
	getFPLBucketName: function(fpl) {
		if (BCBSM.SubsidyEstimator.FPLBuckets['A'].fplLow <= fpl && fpl < BCBSM.SubsidyEstimator.FPLBuckets['A'].fplHigh) {
			return 'A';
		} else if (BCBSM.SubsidyEstimator.FPLBuckets['B'].fplLow <= fpl && fpl < BCBSM.SubsidyEstimator.FPLBuckets['B'].fplHigh) {
			return 'B';
		} else if (BCBSM.SubsidyEstimator.FPLBuckets['C'].fplLow <= fpl && fpl < BCBSM.SubsidyEstimator.FPLBuckets['C'].fplHigh) {
			return 'C';
		} else if (BCBSM.SubsidyEstimator.FPLBuckets['D'].fplLow <= fpl && fpl <= BCBSM.SubsidyEstimator.FPLBuckets['D'].fplHigh) {
			return 'D';
		} else if (BCBSM.SubsidyEstimator.FPLBuckets['E'].fplLow < fpl && fpl < BCBSM.SubsidyEstimator.FPLBuckets['E'].fplHigh) {
			return 'E';
		} else if (BCBSM.SubsidyEstimator.FPLBuckets['F'].fplLow <= fpl && fpl <= BCBSM.SubsidyEstimator.FPLBuckets['F'].fplHigh) {
			return 'F';
		}
		return 'G';
	},

	// This function corresponds to cell 'Income Base'!C6 in the spreadsheet.
	// I pulled out the formula used to calculate this cell, evaulated its
	// logic, and distilled the calculation into this function.
	getApplicablePercentage: function(fpl, fplBucketName) {
		var fplBucket = BCBSM.SubsidyEstimator.FPLBuckets[fplBucketName];
		if (fplBucketName === 'A' ||
			fplBucketName === 'F' ||
			fplBucketName === 'G') {
			return fplBucket.finalPer;
		}
		var appPercent = (((fpl - fplBucket.fplLow) * (fplBucket.finalPer - fplBucket.initialPer)) / (fplBucket.fplHigh - fplBucket.fplLow)) + fplBucket.initialPer;
		appPercent = ((appPercent *100).toFixed(2))/100;
		return appPercent;
	},

	// This function retrieves the age factor from the object defined above.
	// Since concessions have to be made for ages over 64, this function should
	// be used to get the age factor; the factor should not be pulled directly
	// from the object above.
    getAgeFactor: function(age) {
        if (isNaN(parseInt(age)) || parseFloat(age) !== parseInt(age)) {
            // The provided argument is not an integer
            throw "Invalid argument. Integer expected.";
        }
        if (age > 64) {
            age = 64;
        }
        return parseFloat(BCBSM.SubsidyEstimator.ageFactors[age]);
    },

	// This is a utility function which adds commas to numbers, separating
	// thousands to make them more readable
	// Example: addNumSep(10000.00) returns '10,000.00'
    addNumSep: function(num) {
        // This method was adapted from http://stackoverflow.com/a/2646441
        num += '';
        var x = num.split('.');
        var x1 = x[0];
        var x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    },

	// Ultimately, this function corresponds to cell 'Income base'!C18 of the
	// spreadsheet. In order to arrive at the final number calculated by the
	// spreadsheet in this cell, this function also calulates the values in
	// 'Income base'!C16 and 'Income base'!C17.
    estimatePrice: function(ages, income, basePremium) {
		// Clean up 'income' input since this is now supplied via text field
		// This is spreadsheet cell 'Income base'!C4
		income = income.replace(/[^0-9\.]/g, '');

		// This is spreadsheet cell 'Income base'!C5
		var famSize = ages.length;

		// This is spreadsheet cell 'Income base'!C3
		var fpl = BCBSM.SubsidyEstimator.getFPL(famSize, income);
		var fplBucketName = BCBSM.SubsidyEstimator.getFPLBucketName(fpl);
		profilestore.setProperty('costShare', fplBucketName);
		// call cost share function: check to see if content is loaded
		if($('.listplanbucket').length > 0 || $('.table').length > 0){
			if($('.listplanbucket').length > 0 || $('.plan_compare').length > 0){
				BCBSM.CostShare.displayCostShareOnBucketPage();
			}else{	
				BCBSM.CostShare.displayCostShareOnPlanPage();
			}
		}

		
		
		// This is spreadsheet cell 'Income base'!C6
		var applicablePct = BCBSM.SubsidyEstimator.getApplicablePercentage(fpl, fplBucketName);

		// This is spreadsheet cell 'Income base'!C7
		var maxPayment = Math.round(applicablePct * income);

        // We only use the first 3 dependents in estimate calculations
        var dependentCount = 0;
        var trimmedAges = new Array;
        $.each(ages, function(idx, age) {
            if (age < 21) {
                if (++dependentCount <= 3) {
                    trimmedAges.push(age);
                }
            } else {
                trimmedAges.push(age);
            }
        });

		// This is spreadsheet cell 'Income base'!C16
        var totalPremium = BCBSM.SubsidyEstimator.calculateTotalPremium(trimmedAges, basePremium);
       

		// This is spreadsheet cell 'Income base'!C17
        var premiumTaxCredit = totalPremium - maxPayment;
        
        var monthlyPremiumTaxCredit = Math.round((premiumTaxCredit/12) * 100) / 100;

		// We've got all the data we need so we can return the results.
		// If the user is in FPL bucket G, they are not eligible for a subsidy
		// nor an out of pocket reduction. The same applies if the calculated
		// tax credit is negative.
        if (fplBucketName === 'G' || premiumTaxCredit < 0) {
            return {
				'medicare': fplBucketName === 'A',
                'eligible': false,
				'oopMaxReduction': false,
                'priceToPurchaser': totalPremium,
                'premiumTaxCredit': 0.00,
                'monthlyPremiumTaxCredit': 0.00,
                'fplevel': (fpl*100).toFixed(0)
            };
        }

		// If we reach this point, the user is eligible for a subsidy.
		// If they're in FPL buckets B, C, or D, they are eligible for an out
		// of pocket max reduction.
        return {
			'medicare': fplBucketName === 'A',
            'eligible': true,
			'oopMaxReduction': (fplBucketName === 'B' || fplBucketName === 'C' || fplBucketName === 'D'),
            'totalPremium': totalPremium,
            'priceToPurchaser': (totalPremium - premiumTaxCredit).toFixed(2),
            'premiumTaxCredit': premiumTaxCredit.toFixed(2),
            'monthlyPremiumTaxCredit': monthlyPremiumTaxCredit.toFixed(2),
            'fplevel': (fpl*100).toFixed(0)
        };
    },

	// This function effectively calculates spreadsheet cell
	// 'Rating factor adj benckmark'!B15. The difference here is that the geographic
	// factor has already been applied to the basePremium parameter so it is not applied
	// in this function.
    calculateTotalPremium: function(ages, basePremium) {
        var totalPremium = 0;
        $.each(ages, function(idx, age) {
            totalPremium += basePremium * BCBSM.SubsidyEstimator.getAgeFactor(age);
        });
        return totalPremium.toFixed(2);
    }
};
var checkCapturedCsInit,capturedCostShare;
BCBSM.CostShare = {
	getUrlInfo: function(){
		var urlInfoCS = window.location.pathname;
		return urlInfoCS; 
	},
	getUrlCostShareVal: function(){
		var costShareInfo;
		var capturedCostShare;
		if(!checkCapturedCsInit){//check and see if the value has been pulled from the URL once
			costShareInfo = window.location.search;// Grab costShare Variable
			if(costShareInfo !==""){
				checkCapturedCsInit = true;
			}
			capturedCostShare = costShareInfo.replace("?costshare=","");
			if(capturedCostShare !== ""){
				profilestore.setProperty("costShareNumb", capturedCostShare);
			}
		}else{
		 	capturedCostShare = profilestore.getProperty("costShareNumb");
		}
		return capturedCostShare;
	},
	getCurrentYear:function(){
		var currentDateCS = new Date();
		var currentYearCS = currentDateCS.getFullYear(); 
		return currentYearCS
	},
	getCurrentMonth: function(){
		var currentDateCS = new Date();
		var currentMonthCS = currentDateCS.getMonth();
		return currentMonthCS;
	},
	getPreviousYearCheck: function(){
		var previousYearCheck = false;
		var yearPatternCS = /[0-9]+/g;
		if(yearPatternCS.test(BCBSM.CostShare.getUrlInfo())){
			previousYearCheck = true;
		}
		return previousYearCheck;
	},
	
	getPlanCostShareInfo : function(planNameKey, planGroupKey, costShareKey, year, uid){
		var jsonPath = "/content/dam/public/shared/documents/premiumzips/ibu-premiums.json";
		var planMatchCS = {
		"partnered-hmo-saver" : "partnered_silver_saver",
		"partnered-hmo" : "partnered_silver",
		"partnered-hmo-extra" : "partnered_silver_extra",
		"metro-detroit-hmo-saver" : "metro_detroit_hmo_silver_saver",
		"metro-detroit-hmo" : "metro_detroit_hmo_silver",
		"metro-detroit-hmo-extra" : "metro_detroit_hmo_silver_extra",
		"select-hmo-saver" : "select_silver_saver",
		"select-hmo" : "select_silver",
		"select-hmo-extra" : "select_silver_extra",
		"preferred-hmo" : "preferred_silver",
		"preferred-hmo-extra" : "preferred_silver_extra",
		"metro-detroit-epo" : "metro_detroit_epo_silver",
		"metro-detroit-epo-extra" : "metro_detroit_epo_silver_extra",
		"premier-ppo-saver" : "premier_silver_saver",
		"premier-ppo" : "premier_silver",
		"premier-ppo-extra" : "premier_silver_extra",
		"multi-state-ppo" : "silver_dental_vision",
		"multi-state-ppo-extra" : "silver_dental_vision_extra"
		};
		
		var currentMonthCS = BCBSM.CostShare.getCurrentMonth();
		var currentYearCS = BCBSM.CostShare.getCurrentYear();
		$.ajax(jsonPath, {
            dataType: "json",
            success: function(rawData, status, xhr) {
            	//Open registration check. Open registration is between Oct and end of Dec.
				//During this time the user can register for the following year. 
				//But if a user has qualifying event they can register for the current year.
				//During this time period, add 1 to the currentYear.	
				if(currentMonthCS >=9 && currentMonthCS <=11){
					var previousYearCS = currentYearCS;
					currentYearCS = currentYearCS + 1; 		
				}
                var planYearMatch;
                if(!year){
                    planYearMatch = currentYearCS;
                    if(BCBSM.CostShare.getPreviousYearCheck()){
                        planYearMatch = previousYearCS;
                        if(planYearMatch == "2015"){// we are not displaying dynamic content for cost share for 2015 plans
                            return;
                        }
                    }
                }else{
                    planYearMatch = year;
                }
            	planGroupKey = rawData[planGroupKey]; //similar rawData.hmo
            	planNameMatch = planMatchCS[planNameKey];//translate plan name from url to plan name key in json
            	if(planNameMatch===undefined){
            		planNameMatch = planNameKey;
            	}
            	
            	
            	if(planGroupKey[planNameMatch] === undefined || planGroupKey[planNameMatch] === null){
            		return;
            	}
            	planGroupNameMatch = planGroupKey[planNameMatch];//similar to rawData.hmo.premier_silver
            	planGroupNameYearMatch = planGroupNameMatch[planYearMatch];//similar to rawData.hmo.premier_silver.2016
            	if(planGroupNameYearMatch.cost_share === undefined){
            		return;
            	}
            	inNetworkData = planGroupNameYearMatch.cost_share.in_network[costShareKey];//similar to rawData.hmo.premier_silver.2016.in_network.A
            	var isThereoutNetworkData = false;
            	if(planGroupNameYearMatch.cost_share.out_network != undefined || planGroupNameYearMatch.cost_share.out_network != null ){
            		outNetworkData = planGroupNameYearMatch.cost_share.out_network[costShareKey];//similar to rawData.hmo.premier_silver.2016.out_network.A
            		isThereoutNetworkData = true;
            	}
            	//in-network Data assignment
            	if($('table.plan_compare th').length > 0){//  display data in the compare table 
            	 $("." + planNameKey + "_in_network_deduct_individual").text(inNetworkData.deductible.individual);
	            	$("." + planNameKey + "_in_network_deduct_family").text(inNetworkData.deductible.family);
	            	$("." + planNameKey + "_in_network_co_insurance").text(inNetworkData.co_insurance);
	            	$("." + planNameKey + "_in_network_out_pocket_max_individual").text(inNetworkData.out_of_pocket_maximum.individual);
	            	$("." + planNameKey + "_in_network_out_pocket_max_family").text(inNetworkData.out_of_pocket_maximum.family);
	            	$("." + planNameKey + "_in_network_primary_care").text(inNetworkData.primary_care_visits);
	            	$("." + planNameKey + "_in_network_specialist_visit").text(inNetworkData.specialist_visits);
	            	$("." + planNameKey + "_in_network_urgent_care_co_insurance").text(inNetworkData.urgent_care.co_insurance);
	            	$("." + planNameKey + "_in_network_urgent_care_co_pay").text(inNetworkData.urgent_care.co_pay);
	            	$("." + planNameKey + "_in_network_emergency_room_co_insurance").text(inNetworkData.emergency_room.co_insurance);
	            	$("." + planNameKey + "_in_network_emergency_room_co_pay").text(inNetworkData.emergency_room.co_pay);
	            	$("." + planNameKey + "_in_network_in_patient_co_insurance").text(inNetworkData.in_patient_hospital_stay.co_insurance);
	            	$("." + planNameKey + "_in_network_in_patient_co_pay").text(inNetworkData.in_patient_hospital_stay.co_pay);
	            	$("." + planNameKey + "_in_network_hsa_eligible").text(inNetworkData.hsa_eligible);
	            	$("." + planNameKey + "_co_insurance").text(inNetworkData.co_insurance);
                    $("." + planNameKey + "_in_network_allergy_co_pay").text(inNetworkData.allergy_testing.co_pay);
                    $("." + planNameKey + "_in_network_imaging_services").text(inNetworkData.imaging_services.co_pay);
                    $("." + planNameKey + "_in_network_imaging_services_co_insurance").text(inNetworkData.imaging_services.co_insurance);
                    $("." + planNameKey + "_in_network_maternity_co_pay").text(inNetworkData.delivery_in_hopital.co_pay);
                    $("." + planNameKey + "_in_network_maternity_co_insurance").text(inNetworkData.delivery_in_hopital.co_insurance);
                    $("." + planNameKey + "_in_network_other_services_co_pay").text(inNetworkData.other_hospital_services.co_pay);
                    $("." + planNameKey + "_in_network_rehabilitative_co_pay").text(inNetworkData.rehabilitative_services.co_pay);
                    $("." + planNameKey + "_in_network_in_patient_mental_health_co_insurance").text(inNetworkData.in_patient_mental_health.co_insurance);
                    $("." + planNameKey + "_in_network_in_patient_mental_health_co_pay").text(inNetworkData.in_patient_mental_health.co_pay);
	            	var capturedCostShare= BCBSM.CostShare.changeSubsidyValLetToNumb(costShareKey);
	            	
	            	$("." + planNameKey + "_in_network_costshare").text(capturedCostShare);
	            	
	            }else if(uid){// used to assign data to the correct bucket on the list bucket page
	            	$("#"+uid+" .in_network_deduct_individual").text(inNetworkData.deductible.individual);
	            	$("#"+uid+" .in_network_deduct_family").text(inNetworkData.deductible.family);
	            	$("#"+uid+" .in_network_co_insurance").text(inNetworkData.co_insurance);
	            	$("#"+uid+" .in_network_out_pocket_max_individual").text(inNetworkData.out_of_pocket_maximum.individual);
	            	$("#"+uid+" .in_network_out_pocket_max_family").text(inNetworkData.out_of_pocket_maximum.family);
	            	$("#"+uid+" .in_network_primary_care").text(inNetworkData.primary_care_visits);
	            	$("#"+uid+" .in_network_specialist_visit").text(inNetworkData.specialist_visits);
	            	$("#"+uid+" .in_network_urgent_care_co_insurance").text(inNetworkData.urgent_care.co_insurance);
	            	$("#"+uid+" .in_network_urgent_care_co_pay").text(inNetworkData.urgent_care.co_pay);
	            	$("#"+uid+" .in_network_emergency_room_co_insurance").text(inNetworkData.emergency_room.co_insurance);
	            	$("#"+uid+" .in_network_emergency_room_co_pay").text(inNetworkData.emergency_room.co_pay);
	            	$("#"+uid+" .in_network_in_patient_co_insurance").text(inNetworkData.in_patient_hospital_stay.co_insurance);
	            	$("#"+uid+" .in_network_in_patient_co_pay").text(inNetworkData.in_patient_hospital_stay.co_pay);
	            	$("#"+uid+" .in_network_hsa_eligible").text(inNetworkData.hsa_eligible);
	            	$("#"+uid+" .co_insurance").text(inNetworkData.co_insurance);
                    $("#"+uid+" .in_network_allergy_co_pay").text(inNetworkData.allergy_testing.co_pay);
                    $("#"+uid+" .in_network_imaging_services").text(inNetworkData.imaging_services.co_pay);
                    $("#"+uid+" .in_network_imaging_services_co_insurance").text(inNetworkData.imaging_services.co_insurance);
                    $("#"+uid+" .in_network_maternity_co_pay").text(inNetworkData.delivery_in_hopital.co_pay);
                    $("#"+uid+" .in_network_maternity_co_insurance").text(inNetworkData.delivery_in_hopital.co_insurance);
                    $("#"+uid+" .in_network_other_services_co_pay").text(inNetworkData.other_hospital_services.co_pay);
                    $("#"+uid+" .in_network_rehabilitative_co_pay").text(inNetworkData.rehabilitative_services.co_pay);
                    $("#"+uid+" .in_network_in_patient_mental_health_co_insurance").text(inNetworkData.in_patient_mental_health.co_insurance);
                    $("#"+uid+" .in_network_in_patient_mental_health_co_pay").text(inNetworkData.in_patient_mental_health.co_pay);
	            	var capturedCostShare= BCBSM.CostShare.changeSubsidyValLetToNumb(costShareKey);
	            	
	            	$(".in_network_costshare").text(capturedCostShare);
	            }else{
	            	$(".in_network_deduct_individual").text(inNetworkData.deductible.individual);
	            	$(".in_network_deduct_family").text(inNetworkData.deductible.family);
	            	$(".in_network_co_insurance").text(inNetworkData.co_insurance);
	            	$(".in_network_out_pocket_max_individual").text(inNetworkData.out_of_pocket_maximum.individual);
	            	$(".in_network_out_pocket_max_family").text(inNetworkData.out_of_pocket_maximum.family);
	            	$(".in_network_primary_care").text(inNetworkData.primary_care_visits);
	            	$(".in_network_specialist_visit").text(inNetworkData.specialist_visits);
	            	$(".in_network_urgent_care_co_insurance").text(inNetworkData.urgent_care.co_insurance);
	            	$(".in_network_urgent_care_co_pay").text(inNetworkData.urgent_care.co_pay);
	            	$(".in_network_emergency_room_co_insurance").text(inNetworkData.emergency_room.co_insurance);
	            	$(".in_network_emergency_room_co_pay").text(inNetworkData.emergency_room.co_pay);
	            	$(".in_network_in_patient_co_insurance").text(inNetworkData.in_patient_hospital_stay.co_insurance);
	            	$(".in_network_in_patient_co_pay").text(inNetworkData.in_patient_hospital_stay.co_pay);
	            	$(".in_network_hsa_eligible").text(inNetworkData.hsa_eligible);
	            	$(".in_network_sbc_link").attr("href", inNetworkData.sbc_link);
	            	$(".in_network_ambulance").text(inNetworkData.ambulance);
	            	$(".co_insurance").text(inNetworkData.co_insurance);
                    $(".in_network_allergy_co_insurance").text(inNetworkData.allergy_testing.co_insurance);
                    $(".in_network_imaging_services").text(inNetworkData.imaging_services.co_pay);
                    $(".in_network_imaging_services_co_insurance").text(inNetworkData.imaging_services.co_insurance);                    
                    
                    $(".in_network_maternity_co_pay").text(inNetworkData.delivery_in_hopital.co_pay);
                    $(".in_network_maternity_co_insurance").text(inNetworkData.delivery_in_hopital.co_insurance);
                    $(".in_network_other_services_co_pay").text(inNetworkData.other_hospital_services.co_pay);
                    $(".in_network_rehabilitative_co_pay").text(inNetworkData.rehabilitative_services.co_pay);
                    $(".in_network_in_patient_mental_health_co_insurance").text(inNetworkData.in_patient_mental_health.co_insurance);
                    $(".in_network_in_patient_mental_health_co_pay").text(inNetworkData.in_patient_mental_health.co_pay);
                    $(".in_network_out_patient_mental_health_co_pay").text(inNetworkData.out_patient_mental_health.co_pay);
                    $(".in_network_out_patient_mental_health_co_insurance").text(inNetworkData.out_patient_mental_health.co_insurance);
                    $(".in_network_imaging_services_lab_test_co_pay").text(inNetworkData.imaging_services_lab_test.co_pay);
                    $(".in_network_imaging_services_lab_test_co_insurance").text(inNetworkData.imaging_services_lab_test.co_insurance);
	            	var capturedCostShare= BCBSM.CostShare.changeSubsidyValLetToNumb(costShareKey);
	            	
	            	$(".in_network_costshare").text(capturedCostShare);
	            }

            	//Out of network Data assignment
            	if(isThereoutNetworkData){
            		if(uid){
	            		if(planNameMatch === "metro_detroit_epo_silver") {
	            			$("#"+uid+" .out_network_urgent_care_co_insurance").text(outNetworkData.urgent_care.co_insurance);
				        	$("#"+uid+" .out_network_urgent_care_co_pay").text(outNetworkData.urgent_care.co_pay);
				        	$("#"+uid+" .out_network_emergency_room_co_insurance").text(outNetworkData.emergency_room.co_insurance);
				        	$("#"+uid+" .out_network_emergency_room_co_pay").text(outNetworkData.emergency_room.co_pay);
				        	$("#"+uid+" .out_network_hsa_eligible").text(outNetworkData.hsa_eligible);
				        }else if(planNameMatch === "metro_detroit_epo_silver_extra"){
				        	$("#"+uid+" .out_network_urgent_care_co_insurance").text(outNetworkData.urgent_care.co_insurance);
				        	$("#"+uid+" .out_network_urgent_care_co_pay").text(outNetworkData.urgent_care.co_pay);
				        	$("#"+uid+" .out_network_emergency_room_co_insurance").text(outNetworkData.emergency_room.co_insurance);
				        	$("#"+uid+" .out_network_emergency_room_co_pay").text(outNetworkData.emergency_room.co_pay);
				        	$("#"+uid+" .out_network_hsa_eligible").text(outNetworkData.hsa_eligible);
				        }else{
				        	$("#"+uid+" .out_network_deduct_individual").text(outNetworkData.deductible.individual);
				        	$("#"+uid+" .out_network_deduct_family").text(outNetworkData.deductible.family);
				        	$("#"+uid+" .out_network_co_insurance").text(outNetworkData.co_insurance);
				        	$("#"+uid+" .out_network_out_pocket_max_individual").text(outNetworkData.out_of_pocket_maximum.individual);
				        	$("#"+uid+" .out_network_out_pocket_max_family").text(outNetworkData.out_of_pocket_maximum.family);
				        	$("#"+uid+" .out_network_primary_care").text(outNetworkData.primary_care_visits);
				        	$("#"+uid+" .out_network_specialist_visit").text(outNetworkData.specialist_visits);
				        	$("#"+uid+" .out_network_urgent_care_co_insurance").text(outNetworkData.urgent_care.co_insurance);
				        	$("#"+uid+" .out_network_urgent_care_co_pay").text(outNetworkData.urgent_care.co_pay);
				        	$("#"+uid+" .out_network_emergency_room_co_insurance").text(outNetworkData.emergency_room.co_insurance);
				        	$("#"+uid+" .out_network_emergency_room_co_pay").text(outNetworkData.emergency_room.co_pay);
				        	$("#"+uid+" .out_network_in_patient_co_insurance").text(outNetworkData.in_patient_hospital_stay.co_insurance);
				        	$("#"+uid+" .out_network_in_patient_co_pay").text(outNetworkData.in_patient_hospital_stay.co_pay);
				        	$("#"+uid+" .out_network_hsa_eligible").text(outNetworkData.hsa_eligible);	
				        }
				    }else {
				    	if(planNameMatch === "metro_detroit_epo_silver") {
	            			$(".out_network_urgent_care_co_insurance").text(outNetworkData.urgent_care.co_insurance);
				        	$(".out_network_urgent_care_co_pay").text(outNetworkData.urgent_care.co_pay);
				        	$(".out_network_emergency_room_co_insurance").text(outNetworkData.emergency_room.co_insurance);
				        	$(".out_network_emergency_room_co_pay").text(outNetworkData.emergency_room.co_pay);
				        	$(".out_network_hsa_eligible").text(outNetworkData.hsa_eligible);
				        }else if(planNameMatch === "metro_detroit_epo_silver_extra"){
				        	$(".out_network_urgent_care_co_insurance").text(outNetworkData.urgent_care.co_insurance);
				        	$(".out_network_urgent_care_co_pay").text(outNetworkData.urgent_care.co_pay);
				        	$(".out_network_emergency_room_co_insurance").text(outNetworkData.emergency_room.co_insurance);
				        	$(".out_network_emergency_room_co_pay").text(outNetworkData.emergency_room.co_pay);
				        	$(".out_network_hsa_eligible").text(outNetworkData.hsa_eligible);
				        }else{
				        	$(".out_network_deduct_individual").text(outNetworkData.deductible.individual);
				        	$(".out_network_deduct_family").text(outNetworkData.deductible.family);
				        	$(".out_network_co_insurance").text(outNetworkData.co_insurance);
				        	$(".out_network_out_pocket_max_individual").text(outNetworkData.out_of_pocket_maximum.individual);
				        	$(".out_network_out_pocket_max_family").text(outNetworkData.out_of_pocket_maximum.family);
				        	$(".out_network_primary_care").text(outNetworkData.primary_care_visits);
				        	$(".out_network_specialist_visit").text(outNetworkData.specialist_visits);
				        	$(".out_network_urgent_care_co_insurance").text(outNetworkData.urgent_care.co_insurance);
				        	$(".out_network_urgent_care_co_pay").text(outNetworkData.urgent_care.co_pay);
				        	$(".out_network_emergency_room_co_insurance").text(outNetworkData.emergency_room.co_insurance);
				        	$(".out_network_emergency_room_co_pay").text(outNetworkData.emergency_room.co_pay);
				        	$(".out_network_in_patient_co_insurance").text(outNetworkData.in_patient_hospital_stay.co_insurance);
				        	$(".out_network_in_patient_co_pay").text(outNetworkData.in_patient_hospital_stay.co_pay);

				        	$(".out_network_allergy_co_pay").text(outNetworkData.allergy_testing.co_pay);
				        	$(".out_network_allergy_co_insurance").text(outNetworkData.allergy_testing.co_insurance);
				        	$(".out_network_imaging_services_co_pay").text(outNetworkData.imaging_services.co_pay);
				        	$(".out_network_imaging_services_co_insurance").text(outNetworkData.imaging_services.co_insurance);

				        	$(".out_network_imaging_services_lab_test_co_pay").text(outNetworkData.imaging_services_lab_test.co_pay);
                    		$(".out_network_imaging_services_lab_test_co_insurance").text(outNetworkData.imaging_services_lab_test.co_insurance);
                    		$(".out_network_maternity_test_co_insurance").text(outNetworkData.maternity_tests.co_insurance);
				        	$(".out_network_maternity_test_co_pay").text(outNetworkData.maternity_tests.co_pay);

				        	$(".out_network_maternity_care_co_pay").text(outNetworkData.delivery_in_hopital.co_pay);
				        	$(".out_network_maternity_care_co_insurance").text(outNetworkData.delivery_in_hopital.co_insurance);
				        	$(".out_network_other_hospital_services_co_pay").text(outNetworkData.other_hospital_services.co_pay);
				        	$(".out_network_other_hospital_services_co_insurance").text(outNetworkData.other_hospital_services.co_insurance);
				        	$(".out_network_rehabilitative_services_co_pay").text(outNetworkData.rehabilitative_services.co_pay);
				        	$(".out_network_rehabilitative_services_co_insurance").text(outNetworkData.rehabilitative_services.co_insurance);
				        	
				        	



				        	$(".out_network_in_patient_mental_health_co_pay").text(outNetworkData.in_patient_mental_health.co_pay);
				        	$(".out_network_in_patient_mental_health_co_insurance").text(outNetworkData.in_patient_mental_health.co_insurance);
				        	
				        	$(".out_network_out_patient_mental_health_co_pay").text(outNetworkData.out_patient_mental_health.co_pay);
				        	$(".out_network_out_patient_mental_health_co_insurance").text(outNetworkData.out_patient_mental_health.co_insurance);
				        	





				        	$(".out_network_substance_abuse_co_pay").text(outNetworkData.substance_abuse.co_pay);
				        	$(".out_network_substance_abuse_co_insurance").text(outNetworkData.substance_abuse.co_insurance);
				        	
				        	$(".out_network_hsa_eligible").text(outNetworkData.hsa_eligible);	
				        }

				    }
            	}
            }
        });
	},
	compareSubsidyCS: function (key){
		var costShareKey;
		switch(key){ // collect the proper cost share from the subsidy estimator.
					case "D": 
							costShareKey = "D"
							break;
					case "C":
							costShareKey = "C"
							break;
					case "B":
							costShareKey = "B"
							break;
					default:
							costShareKey = "default" 

				}
				return costShareKey;
	},
	changeSubsidyValLetToNumb: function (key){
		var costShareKey;
		switch(key){ // collect the proper cost share from the subsidy estimator.
					case "D": 
							costShareKey = "73"
							break;
					case "C":
							costShareKey = "87"
							break;
					case "B":
							costShareKey = "94"
							break;
					default:
							costShareKey = "70" 

				}
				return costShareKey;
	},
	findCostShare : function(){
		var capturedCostShare = BCBSM.CostShare.getUrlCostShareVal();
		//Check if cost share value has been captured from the url.
		if(capturedCostShare !== ""){
			var costShareNumb = profilestore.getProperty("costShareNumb");
			if(costShareNumb !== "" || costShareNumb !== undefined || costShareNumb !== null){
				if( costShareNumb === "73" || costShareNumb === "87" || costShareNumb === "94" ){
					capturedCostShare = costShareNumb;
				}else {
					capturedCostShare = "70"
				}
			}else{
				capturedCostShare = "70"
			}
		}
        //Checking to see if this page was just opened and if it is a silver page and cost share wasnt set then set costShare = 70.
		if((capturedCostShare === "" || capturedCostShare === "70") && document.referrer === "" && window.history.length <= 1 && window.location.href.indexOf("/michigan-health-insurance/silver") > -1){
			capturedCostShare = "70"
		}
		var costShare = capturedCostShare;
		//If cost share value has been pulled from the URL change the number value to Letter value
		if(profilestore.getProperty("costShare") == undefined || profilestore.getProperty("costShare") == null  || costShare != ""){
			if(!profilestore.getProperty("costShare")|| costShare === "94" || costShare === "87" || costShare === "73" || costShare === "70"  ){
				switch(costShare){
					case "73": 
							costShare = "D"
							break;
					case "87":
							costShare = "C"
							break;
					case "94":
							costShare = "B"
							break;
					default:
							costShare = "default" 

				}
				profilestore.setProperty("costShare", costShare);
				return costShare;
			}else{
				costShare = profilestore.getProperty("costShare"); 
				
				return BCBSM.CostShare.compareSubsidyCS(costShare);
			}
			
		}else {
			costShare = profilestore.getProperty("costShare");
			return BCBSM.CostShare.compareSubsidyCS(costShare);
			
		}
	},
    perPlanBucketInfo : function (info){
        if(info) {
            var attrs = info.split(','), 
            uid = attrs[0],
            planGroup = attrs[1],
            planName = attrs[2],
            planYear = attrs[3],
            costShareMatch = BCBSM.CostShare.findCostShare();
            BCBSM.CostShare.getPlanCostShareInfo(planName, planGroup, costShareMatch, planYear, uid);
        }
                
    },   
	displayCostShareOnPlanPage : function (){
		var urlInfoCS = BCBSM.CostShare.getUrlInfo(),
            planNameToMatch = urlInfoCS.match(/[a-z-]+(?=.html)/g).toString(),
		    planGroup = urlInfoCS.match(/epo|ppo|hmo/g),
            costShareMatch = BCBSM.CostShare.findCostShare();
             if(planGroup){
		    	planGroup = planGroup.toString();
			}
			BCBSM.CostShare.getPlanCostShareInfo(planNameToMatch, planGroup, costShareMatch);

	},
	displayCostShareOnBucketPage : function(){
        if($('.plan_bucket').length > 0){
            var planBucket = $('.plan_bucket');
				for(var x = 0; x < planBucket.length; x++) {
					BCBSM.CostShare.perPlanBucketInfo($(planBucket[x]).attr('zipcode-info'));
				}
	   }else{
				var tHeaders = $('table.plan_compare th')
	   			for(var x = 0; x < tHeaders.length; x++) {
					BCBSM.CostShare.perPlanBucketInfo($(tHeaders[x]).attr('zipcode-info'));
				}
	   }
	}
}