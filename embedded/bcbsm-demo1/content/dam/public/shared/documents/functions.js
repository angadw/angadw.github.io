/* Global Functions
- Updated for Bootstrap 3 10/30/2014 -1500 -js
*/
(function ($) {

    //Get Current Environment
    var CURR_ENV = function () {
        var hostname = window.location.hostname;

        if (hostname === "aut-dev" ||
            hostname === "pub-dev" ||
            hostname === "aut-dev.bcbsm.com" ||
            hostname === "pub-dev.bcbsm.com" ||
            hostname === "pubcmsdev1.bcbsm.com" ||
            hostname === "pubwebdev1.bcbsm.com") {
            return "DEV";
        } else if (
            hostname === "aut-sit" ||
            hostname === "pub-sit" ||
            hostname === "aut-sit.bcbsm.com" ||
            hostname === "pub-sit.bcbsm.com") {
            return "SIT";
        } else if (
            hostname === "aut-uat" ||
            hostname === "pub-uat" ||
            hostname === "aut-uat.bcbsm.com" ||
            hostname === "pub-uat.bcbsm.com") {
            return "UAT";
        }

        //default to PRD
        return "PRD";
    }();
	
	dynamicDate = function(){
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
	var medicareReg = /medicare/g,	
		medicareRegMatch = window.location, 
		medicareDynamicDateParam = medicareReg.test(medicareRegMatch);
	

    /*
BCBSM Modal Path Rewrite Script
Updated 12/02/2012 2020 -cmc

Currently directed at "get-a-quote" modal path only.
*/
    modalPathRewrite = function () {

        var sModalPathSelector = 'a\[href\=\"/tools/get\-a\-quote\.html\"\]',
            sModalDataToggle = 'modal',
            sModalLinkClick =
                'c=\'/content/public/en/tools/get-a-quote.html \#modalContent\'\;' +
                'e\=\'\.modal\-body\'\;' + '\$\.loadContent\(\)',
            sModalLinkTarget = '\_self';
        sModalLinkHref = '\#modalWindow';

        jQuery(sModalPathSelector).attr("data-toggle", sModalDataToggle);

        jQuery(sModalPathSelector).attr({
            onclick: sModalLinkClick,
            target: sModalLinkTarget,
            href: sModalLinkHref
        });

    }



 /*
BCBSM Regular Expression Builder
Updated 12/05/2012 1205 -cmc
*/
    regExpBuilder = function (linkArray) {

        //declare length, regex variable, and attributes to write into each link that passes the test
        var nLinkArrayQuantity = linkArray.length,
            sLinkRegexBuilder = "";

        //build string for disjunctive regular expression based on each path in array
        for (i = 0; i <= (nLinkArrayQuantity - 1); i++) {
            if (i <= nLinkArrayQuantity - 2) {
                sLinkRegexBuilder = sLinkRegexBuilder + linkArray[i] + "|";
            } else {
                sLinkRegexBuilder = sLinkRegexBuilder + linkArray[i];
            }
        }

        //use string to declare new regex
        var rGeneratedRegExp = new RegExp(sLinkRegexBuilder);
        //return generated RegExp
        return rGeneratedRegExp

    }

/*
BCBSM External Link Handler Script
Updated, added currentHost variable to detect current host 12/14/2012 -cmc
*/
    externalLinkHandler = function () {
        var currentHost = window.location.host;
        var jsonarray = [currentHost];
        var json =  $.getJSON("/content/dam/public/shared/documents/externalModal.json", function(data) {
            // console.log(data);
            $.each(data.aModalLinks, function(value) {
                    jsonarray[value+1] = data.aModalLinks[value];
                    return jsonarray;    
            });
            // console.log(jsonarray[0]);
            var message =
                "Please note that you\'re leaving the Blue Cross Blue Shield of Michigan website. \n\n" +
                "While we recommend this site, we aren\'t responsible for its content. It may have different terms, conditions and privacy policies that you\'ll need to follow."; 

            $('a').each(function () {
                var rInternalLinkCheck = regExpBuilder(jsonarray);
                // console.log(rInternalLinkCheck);

                if (!rInternalLinkCheck.test(this.href)) {
                  $(this).addClass("external"); //Add external class to external links                  
                } 
                else {
                  $(this).removeClass("external").addClass("internal");
                  $('a.external').unbind('click');
                }
            });

            //For manually inserted exceptions, remove class just added
            $("a.exception").removeClass("external");

            //click event for all links with the external class just added  
            $('a.external').click(function (event) {
              event.preventDefault();
              event.stopPropagation();
              var answerOk = confirm(message);
              if (answerOk) {
                window.open(this.href, '_blank');
              }
            });
        });
      }




    /*
BCBSM Accordion Loader 
cmc 11/27/2012 1300
function for loading accordion content (called in doc ready)
*/
    accordionLoader = function () {
        var oAccordionGroupSet = jQuery('.accordion-toggle');
        var nAccordionGroupQty = oAccordionGroupSet.length;
		
        //Check if an accordion exists on the page
        if (nAccordionGroupQty !== 0) {
            var firstAccordionGroup = oAccordionGroupSet[0];

            //for each accordion group, load content defined in link
            $(oAccordionGroupSet).each(function () {
                var sCurrentRel = $(this).attr('rel');
                var sCurrentDiv = $(this).attr('href') + ' .accordion-inner';

                if (this.href === firstAccordionGroup.href) {
                    $(sCurrentDiv).load(sCurrentRel, function (response, status, xhr) {
                        //$('.accordion-toggle:first').click();
						
                    });
                } else if (this.href !== firstAccordionGroup.href) {
                    $(sCurrentDiv).load(sCurrentRel, function (response, status, xhr) {
						
					});
                }
				
				
            });
			
        } else {
            //console.log("No accordion on page.");
        }
    }



    //Relocated 12/02/2012 2007 -cmc
    var modalDiv = '<div class=\"modal hide\" id=\"modalWindow\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\" aria-hidden=\"true\">' +
        '<div><button type=\"button\" class=\"close\" data-dismiss=\"modal\">x</button>' +
        '<div id=\"clear\"></div></div>' +
    //'<div class=\"tabLoad\"><img src=\"'+ imagePath +'loading2.gif\" /></div>' + 
    '<div class=\"modal-body\" id=\"modalContent\"></div></div>';

    //Relocated 12/02/2012 2007 -cmc
    $.loadContentFirst = function (dDate){
	
        $('body').append('' + modalDiv + '');

        $(e).load(c, function (response, status, xhr) {
            if (status == "error") {
                $(e).html(errorLoadingContent);
            }
            //$(e).hide();
            //$(e).fadeIn();
            //commented out tooltips per conversation with gr, cmc -11/26 12:38
            //$('a[rel=tooltip]').tooltip();
            if (status == "success") {
                $(this).trigger('loadComplete');
                if($('body.medicare').length===0){
                    externalLinkHandler();
                }
				
				if(dDate){
					dynamicDate();
				}
				
            }
        });
    };

    //Relocated and updated 12/02/2012 2007 -cmc
    //changed to allow adding scripts in modals - bbenvenuti 8-8-2013
    $.loadContent = function () {
        $('body').append('' + modalDiv + '');

        //$(e).load(c, function (response, status, xhr) {
        //   if (status == "error") {
        //       $(e).html(errorLoadingContent);
        //   }
        //});

        var hashLoc = c.split(' ');
        var hash = hashLoc[1];
        var url = hashLoc[0];

        $.get(url, function(data){
            $(e).html($(data).filter(hash));
            //this will grab the first script in the modal with id of "script" and run it
            var theScript = function(){
                if ($(data).filter('#script').length > 0){
                    return $(data).filter('#script')[0].innerHTML;
                }
                return null;  
            }();
            if (theScript){
                eval(theScript);
            }
        });
        
    };


    // Animate the search input field
    $(document).on('focus', '.searchHolder .search-query', function () {
        $(this).animate({
            width: $(this).width() == 200 ? 122 : 200
        }, 300);
        $(this).select();
    });
    $(document).on('blur', '.searchHolder .search-query', function () {
        $(this).animate({
            width: $(this).width() > 122 ? 122 : 200
        }, 300);
        //$(this).select();
    });

    // MiBCN Modal
/*
    /*##################################################
    #################LZ commenting out 2/18/14############
    ##################################################

    function mibcnCheck() {
        //  var refer = getUrlVars()["refer"];
        refer = $.getUrlVar('refer');
        if (refer == 'mibcn' || document.domain == 'mibcn.com' || document.domain ==
            'www.mibcn.com') {
            mibcnModal();
        }
    }

    function mibcnModal() {
        var modalMarkup =
            '<div class=\"modal hide fade\" id=\"mibcnModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\" aria-hidden=\"true\">     <div class=\"modal-header\" style="border-bottom: none;">        <a class=\"close\" href=\"http://www.bcbsm.com' +
            window.location.pathname +
            '\" aria-hidden=\"true\">&times;</a>             </div>     <div class=\"modal-body\" style=\"padding: 15px 31px 40px;\"><h1 style="font-weight: normal;">Welcome Blue Care Network Customers!</h1>        <p style=\"color: #797979; margin: 0 30px 20px 0; font-size: 15px;\">You\'re seeing this message because you originally came to MiBCN.com, the website for Blue Care Network.</p>        <p style=\"color: #797979;  margin: 0 30px 20px 0; font-size: 15px;\">We recently combined MiBCN.com with the Blue Cross Blue Shield of Michigan website.  BCBSM.com is your new destination to find a doctor, choose an insurance plan, or get help with your HMO coverage.</p>        <p style=\"color: #797979;  margin: 0 30px 20px 0; font-size: 15px;\">We appreciate your patience during this transition.  Please <a href=\"http://www.bcbsm.com/content/public/en/index/health-insurance-help/contacts.html\">contact us</a> if you have any questions.</p><p margin: 0 30px 20px 0;\">        <a style=\"font-weight: bold; text-shadow: none; margin-top: 5px; margin-left: 0; margin-bottom: 5px; font-size: 13px;\" class=\"btn greenButton loginbutton\" href=\"http://www.bcbsm.com' +
            window.location.pathname +
            '\">GET STARTED <i class=\"icon-play icon-white\"></i></a></div> </div>';

        $('body').prepend(modalMarkup);
        // setCookie("mibcnVisit", "0", new Date(Date.parse("Jan 1, 2050")));
        $("#mibcnModal").modal();
    }
*/
    // Inject OO_Feedback Javascript Link

    function injectFeedback() {
        $('a[href*="inject_feedback"]').attr('onclick', 'oo_feedback.show()').attr(
            'href', '#');
    }
    // Standard Code to set/retrieve/delete cookies

    function setCookie(sName, sValue, oExpires) {
        var sCookie = sName + ("=" + sValue);
        if (oExpires) {
            nowTime = (new Date).getTime();
            sCookie += "; expires=" + oExpires.toGMTString() + "; " + nowTime;
        }
        document.cookie = sCookie;
    }

    function getCookie(sName) {
        var sRE = "(?:; )?" + sName + "=([^;]*);?";
        var oRE = new RegExp(sRE);
        if (oRE.test(document.cookie)) {
            return decodeURIComponent(RegExp.$1);
        } else {
            //console.log("Setting a cookie");
            return "";
        }
    }

    function deleteCookie(sName) {
        setCookie(sName, "", new Date(0));
    }

    // Get URL Parameters
    $.extend({
        getUrlVars: function () {
            var vars = [],
                hash;
            var hashes = window.location.href.slice(window.location.href.indexOf(
                '?') + 1).split('&');
            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i].split('=');
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }
            return vars;
        },
        getUrlVar: function (name) {
            return $.getUrlVars()[name];
        }
    });


    $(document).ready(function () {

        msieversion();


        // check for mibcn referrer and show modal
        //mibcnCheck();
        // inject Online Opinion Website Feedback 
        injectFeedback();

        var imagePath = '/content/dam/public/shared/documents/img/';

        $.expr[':'].external = function (obj) {
            return (obj.hostname != location.hostname);
        };

        $('.backToTop').click(function () {
            $('body,html').animate({
                scrollTop: $('#content').offset().top - 20
            }, 800);
        });

        //Set variables for search page and the search string
        var searchPage = '/content/public/en/search.html'; //the name/location of the search page
        var searchUrl = 'http://search.bcbsm.com/search?q='; //The GSA search source
        var searchTerm = $.getUrlVar('q'); //Pull the search term from the URL
        var searchSite = '&site=pub'; //default site is the BCBSM site...  
        var searchOutput = '&output=xml_no_dtd'; //this can't change, unless you want to break the search
        var start = 0; //Start at the first result
        var fullUrl = searchUrl + searchTerm + searchSite + searchOutput +
            '&start=' + start; //All together now!

        // Pass query string to search page for top/bottom search boxes on form submita 
        $('.siteSearchTop').submit(function (ev) {
            var queryString = $('.siteSearchTop');
            document.location = '/content/public/en/search.html' + queryString;
        });

        $.doSearch = function () {
            if ($('.search-query').val() == '') {
                $('.search-query').val(searchTerm);
            } else {
                searchTerm = $('.search-query').val();
            }

            $('.searchResults').empty();
            $('.searchResults').hide();
            $('.searchResults').fadeIn();

            fullUrl = searchUrl + searchTerm + searchSite + searchOutput +
                '&start=' + start;
            $('body,html').animate({
                scrollTop: 0
            }, 800);
            $.showSearch();
        };

        // Search nav button functionality
        $('.searchPager').click(function () {
            $('.searchPager').css("font-size", "12px");
            $('.searchPager').css("font-weight", "normal");
            $('.searchPager').removeClass("searchActive");
            $('.searchPager').addClass("searchPager");
            $(this).addClass("searchPager searchActive");
            $("#endOfRoad").remove();
        });

        $('#search1').click(function () {
            start = 0;
            $.doSearch();
        });
        $('#search2').click(function () {
            start = 11;
            $.doSearch();
        });
        $('#search3').click(function () {
            start = 21;
            $.doSearch();
        });
        $('#search4').click(function () {
            start = 31;
            $.doSearch();
        });
        $('#search5').click(function () {
            start = 41;
            $.doSearch();
        });
        $('#search6').click(function () {
            start = 51;
            $.doSearch();
        });
        $('#search7').click(function () {
            start = 61;
            $.doSearch();
        });
        $('#search8').click(function () {
            start = 71;
            $.doSearch();
        });
        $('#search9').click(function () {
            start = 81;
            $.doSearch();
        });
        $('#search10').click(function () {
            start = 91;
            $.doSearch();
            $(".searchResults").after(
                '<div id="endOfRoad">In order to show you the most relevant content, we have omitted some results. If you like, you can <a href="' +
                searchPage + '">try your search again</a>.</div>');
        });



        $('#searchBack').click(function () {
            $.goBack();
        });
        $('#searchNext').click(function () {
            $.goNext();
        });

        $.goBack = function () {
            if (start == 11) {
                $('#search1').click();
            } else if (start == 21) {
                $('#search2').click();
            } else if (start == 31) {
                $('#search3').click();
            } else if (start == 41) {
                $('#search4').click();
            } else if (start == 51) {
                $('#search5').click();
            } else if (start == 61) {
                $('#search6').click();
            } else if (start == 71) {
                $('#search7').click();
            } else if (start == 81) {
                $('#search8').click();
            } else if (start == 91) {
                $('#search9').click();
            }
        }
        $.goNext = function () {
            if (start == 0) {
                $('#search2').click();
            } else if (start == 11) {
                $('#search3').click();
            } else if (start == 21) {
                $('#search4').click();
            } else if (start == 31) {
                $('#search5').click();
            } else if (start == 41) {
                $('#search6').click();
            } else if (start == 51) {
                $('#search7').click();
            } else if (start == 61) {
                $('#search8').click();
            } else if (start == 71) {
                $('#search9').click();
            } else if (start == 81) {
                $('#search10').click();
            }
        }

        $.showSearch = function () {
            (function ($) {
                $.extend({
                    _prepareYQLQuery: function (query, params) {
                        $.each(
                            params, function (key) {
                            var name = "#{" + key + "}";
                            var value = $.trim(this);
                            if (!value.match(/^[0-9]+$/)) {
                                value = '"' + value + '"';
                            }
                            while (query.search(name) > -1) {
                                query = query.replace(name, value);
                            }
                            var name = "@" + key;
                            var value = $.trim(this);
                            if (!value.match(/^[0-9]+$/)) {
                                value = '"' + value + '"';
                            }
                            while (query.search(name) > -1) {
                                query = query.replace(name, value);
                            }
                        });
                        return query;
                    },
                    yql: function (query) {
                        var $self = this;
                        var successCallback = null;
                        var errorCallback = null;

                        if (typeof arguments[1] == 'object') {
                            query = $self._prepareYQLQuery(query, arguments[1]);
                            successCallback = arguments[2];
                            errorCallback = arguments[3];
                        } else if (typeof arguments[1] == 'function') {
                            successCallback = arguments[1];
                            errorCallback = arguments[2];
                        }
                        var doAsynchronously = successCallback != null;
                        var yqlJson = {
                            url: "http://query.yahooapis.com/v1/public/yql",
                            dataType: "jsonp",
                            success: successCallback,
                            async: doAsynchronously,
                            data: {
                                q: query,
                                format: "json",
                                env: 'store://datatables.org/alltableswithkeys',
                                callback: "?"
                            }
                        };
                        $.ajax(yqlJson);
                        return $self.toReturn;
                    }
                });

                $.yql('select * from xml where url="' + fullUrl + '"',

                function (data) {
                    // Default behavior if the search returns no results...
                    if (data.query.results.GSP.RES == null) {
                        var title = 'Your search for "<strong>' + searchTerm +
                            '</strong>" did not match any pages or documents.<br /><br />'

                        $(".noResults").append(title + 'Suggestions:<br /><ul>' +
                            '<li>Make sure all words are spelled correctly.</li>' +
                            '<li>Try different keywords.</li>' +
                            '<li>Try more general keywords</li></ul>');

                    } else {
                        count = data.query.results.GSP.RES.M;
                        data = data.query.results.GSP.RES.R;
                        var x = 0;

                        // Set variables for the results counts at the top and bottom of the search
                        if (start == 0) {
                            range = '1-10';
                        } else if (start == 11) {
                            range = '11-20';
                        } else if (start == 21) {
                            range = '21-30';
                        } else if (start == 31) {
                            range = '31-40';
                        } else if (start == 41) {
                            range = '41-50';
                        } else if (start == 51) {
                            range = '51-60';
                        } else if (start == 61) {
                            range = '61-70';
                        } else if (start == 71) {
                            range = '71-80';
                        } else if (start == 81) {
                            range = '81-90';
                        } else if (start == 91) {
                            range = '91-100';
                        }

                        //Default behavior if there is no query string in the URL...

                        // Hide Best Match Results
                        $("#bestMatch").hide();

                        if (!searchTerm) {

                            /*
                    var title = '<strong>Please Enter your Search Term:</strong><br>';
                    $(".searchResults").append(title +'<div style="position: relative; width: 257px;"><form class="siteSearchTop" method="GET" action="search.htm">' 
                    + '<input type="text" class="search-query searchPageField" placeholder="Search" name="q">'
                    + '<input type="submit" class="searchIcon" id="searchIconBottom" value="" />'
                    + '</form></div>');
                    */
                            $(".results").hide();


                        } else {
                            $(".results").html('<strong>' + range +
                                '</strong> of about <strong>' + count +
                                '</strong> for <span class="termSpan"><strong>' +
                                searchTerm + '</strong></span>.');

                            // Best Match Library and functions
                            //var match1 = "reform";
                            //var match2 = "member+portal";
                            //var match3 = "dental";
                            //var match4 = "optical";
                            //var match5 = "vision";

                            $.doMatch = function () {
                                var title = 'Best Match Results:';
                                $("#bestMatch").fadeIn();
                                $("#bestMatch").html('<h4>' + title + '</h4>' +
                                    '<a style="color: #000; text-decoration: none;" target="_blank" href="' +
                                    matchUrl + '">' +
                                    'Looking for information on <span class="termSpan" style="color: #0144af;"><strong> ' +
                                    searchTerm + '</strong></span>?<br>' +
                                    matchMessage + '</a>');
                            };

                            /* Disabled -cmc 11/26/2012 1632
                    if(searchTerm.indexOf(match1) != -1){
                        var matchUrl = "http://www.bcbsm.com/healthreform/";
                        var matchMessage = "Health Reform";
                        $.doMatch();
                    } else if(searchTerm.indexOf(match2) != -1){
                        var matchUrl = "http://www.bcbsm.com";
                        var matchMessage = "BCBSM Homepage";
                        $.doMatch();
                    } 
                    */

                            // iterate through and output the results
                            while (x < data.length) {
                                if (data[x].MIME == 'application/pdf') {
                                    var stdLink = '<img src="' + imagePath +
                                        'pdfNew.png" width="32" height="32" style="float: left; margin: 0px 5px 30px 0px"><a class="gLink" href="' +
                                        data[x].U + '" target="_blank">' + data[
                                        x].T + '</a>';
                                } else {
                                    var stdLink = '<img src="' + imagePath +
                                        'icon_webpage.png" width="32" height="32" style="float: left; margin: 0px 5px 30px 0px"><a class="gLink" href="' +
                                        data[x].U + '" target="_blank">' + data[
                                        x].T + '</a>';
                                }

                                $(".searchResults").append(
                                    '<div class="resultItem">' + stdLink +
                                    '<span class="gDesc">' + data[x].S +
                                    '</span><br>' + '<span class="gDate">' +
                                    data[x].FS.VALUE + '</span>' + '</div>');
                                x++;
                            }
                            $('#searchMore').fadeIn();

                            // replace the "+" symbol with a space inside the best match and search results spans
                            $('.termSpan').html($('.termSpan').html().replace(
                                /[%2B,+]/g, " "));
                        }
                    }
                });
            })(jQuery);

        }

        // Load functions that need to run on body load
        $(function () {

            // check for mibcn referrer and show modal
            //mibcnCheck();

            //when doc is ready, load accordion contents
            accordionLoader();


            $.kickStart();

            // Create tooltips for all Anchors and Spans with 'rel="tooltip"' in the tag
            // Changed the way tooltips are invoked to account for dynamic content 
            //and a bug in IE that shows original title attribute tooltip -bbenvenuti

            $(document).on('mouseenter', 'a[rel=tooltip]', function() {
                var $e = $(this);
                if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
                    $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
                }
                $e.tooltip('show');
            });


            //Find all links on a page and check to see if they are internal/external
            $.expr[':'].external = function (obj) {
                return (obj.hostname != location.hostname);
            };
			
			
        });





        // Load content from external page into tabs, accordions or modal popups
        var loadImg = '.tabLoad';

        var errorLoadingContent =
            '<div class=\"alert alert-error\"><strong>Sorry but there was an error ' +
            'loading the requested content</strong><br>Please check back soon.</div>';


        $.kickStart = function () {

            //updated 11052012 1019 cmc, correct link, missing quotes 
            //updated 03192013 LZ, Removed first visit drawer
            //updated 07252013 Brad B, update for new member banner dropdown
            var panel = $('#panel'),
            handle = $('.handle-container');

            if ( panel.length > 0 && handle.length > 0 ){

                //needed in cq-->
                panel.prependTo('body');
                handle.prependTo('#main_bg');

                //setup event handlers
                memberBanner.setupEvents();

                if (!getCookie("firstVisitMemberBanner")) {

                    //initial open - delay 1 second
                    setTimeout( function() {
                        $('html, body').animate({ scrollTop: 0 }, 'slow' );
                        memberBanner.toggle();
                    }, 1000);

                    //set cookie to stop opening automatically
                    setCookie("firstVisitMemberBanner", "0", new Date(Date.parse("Jan 1, 2050")));
                }
            }

            //$('#fvToggle').click(function () {
                //$("#firstVisit").slideToggle('slow');
                // slideDown(600).delay(5000).slideUp(600); // Replaced with toggle
            //});

            //not related to member banner... not sure what this is for -brad
            if ($('.ajLink')) {
                var tabLink = $('.ajLink:first');
                tabLink.tab('show');
                c = tabLink.attr('rel');
                e = '#tabContent';
                $.loadContentFirst();
            }
			
        }


        // Specifically for Tabbed Content
        $('.ajLink[data-toggle="tab"]').click(function (event) {
            event.preventDefault();
            event.stopPropagation();
            $(this).tab('show');
        });
        
        $(document).on('shown.bs.tab', '.ajLink[data-toggle="tab"]', function (event) {
            c = $(this).attr('rel');
            e = '#tabContent';
            $.loadContentFirst();
        });



        //go to and open function-begin

        $(document).ready(function(){
        var doc = self.document.location.hash;
            if(doc.substring() == "#FindYourPlan"){
				var el = $("a[href='"+ doc.substring() +"']"); 
				$('html,body').animate({scrollTop: el.offset().top-10},'slow');
				el.click();
			}            
        });

        //go to and open function-end

		
        // Collapse Content
        $('[data-toggle="collapse"]').click(function (event) {
            event.preventDefault();
            event.stopPropagation();        
            $(this).collapse('show');
            $($(this).attr('href')).toggleClass('in');
			if(medicareDynamicDateParam){
				dynamicDate();
			}
        });

        $(document).on('shown.bs.collapse', '[data-toggle="collapse"]', function (event) {
            c = $(this).attr('rel');
            e = $(this).attr('href');
            $.loadContentFirst(medicareDynamicDateParam);
        });

        // Specifically for the green Get a Quote buttons
                // $(".getQuoteButton").click(function () {
                //     if(/silver/.test(window.location.pathname)|| /gold/.test(window.location.pathname)){
                //         if(/multi-state-ppo/.test(window.location.pathname)){
                //             c = '/content/public/en/index/plans/michigan-health-insurance/get-a-quote/new-renew-modal.html #modalContent';
                //             e = '.modal-body';
                //             $.loadContent();
                //             $("#modalWindow").modal();
                //          }
                //      }    
                // });
             

        //Get JSON data for login/registration popup
        var loginData = {};
        $.getJSON("/content/dam/public/shared/documents/login-form-config.json", function (
            data) {
            loginData = data;
        })
            .error(function () {
            console.log(
                'Failed to load login-form-config.json. Login popup and registration links not loaded!');
        })
            .complete(function () {
            // Login Popup Window and Forms Functionality and Content

            var memberRegMessage =
                '<strong>Not Registered?</strong>  Get access to your  online account. <a href="' +
                loginData[CURR_ENV].member.regLink + '">Register Now</a>',
                employerRegMessage =
                    '<strong>Not Registered?</strong>  Get access to your employer portal. <a href="' +
                    loginData[CURR_ENV].employer.regLink + '">Register Now</a>',
                agentRegMessage =
                    '<strong>Not Registered?</strong>  Get access to your agent portal. <a href="' +
                    loginData[CURR_ENV].agent.regLink + '">Register Now</a>',
                providerRegMessage =
                    '<strong>Not Registered?</strong>  Get access to your provider portal. <a href="' +
                    loginData[CURR_ENV].provider.regLink + '">Register Now</a>';

            // Populate the login popup and form elements with the correct titles and links, etc.
            $(".username").html(loginData.username_text);
            $(".password").html(loginData.password_text);
            $("#loginTitle").html(loginData.title_text);

            // Populate the "Forgot your username or password?" links for each constituency
            $("#forgotMember").html('Forgot your <a href="' + loginData[
                CURR_ENV].member.forgotLink + '">username</a> or <a href="' +
                loginData[CURR_ENV].member.forgotLink + '">password?</a>');
            $("#forgotEmployer").html('<a href="' + loginData[CURR_ENV].employer
                .forgotLink + '">Forgot your username or password?</a>');
            $("#forgotAgent").html('<a href="' + loginData[CURR_ENV].agent.forgotLink +
                '">Forgot your username or password?</a>');
            $("#forgotProvider").html('<a href="' + loginData[CURR_ENV].provider
                .forgotLink + '">Forgot your username or password?</a>');

            // Add the constituency names to the tabs
            $("#tab-member").html('<span>' + loginData[CURR_ENV].member.title +
                '</span>');
            $("#tab-group").html('<span>' + loginData[CURR_ENV].employer.title +
                '</span>');
            $("#tab-agent").html('<span>' + loginData[CURR_ENV].agent.title +
                '</span>');
            $("#tab-provider").html('<span>' + loginData[CURR_ENV].provider.title +
                '</span>');

            // Code to use cookies to set the default login tab and form content that is displayed
            $('.loginTabs ul li').removeClass('active');
            $('.loginForm').hide();

            if (getCookie("loginURL") == "0") {
                $('#tab-member').addClass('active');
                $('#formMember').show();
                $('#registerMessage').html(memberRegMessage);
            } else if (getCookie("loginURL") == "1") {
                $('#tab-agent').addClass('active');
                $('#formAgent').show();
                $('#registerMessage').html(agentRegMessage);
            } else if (getCookie("loginURL") == "2") {
                $('#tab-group').addClass('active');
                $('#formEmployer').show();
                $('#registerMessage').html(employerRegMessage);
            } else if (getCookie("loginURL") == "3") {
                $('#tab-provider').addClass('active');
                $('#formProvider').show();
                $('#registerMessage').html(providerRegMessage);
            } else {
                $('#tab-member').addClass('active');
                $('#formMember').show();
                $('#registerMessage').html(memberRegMessage);
            }

            $("#tab-member").click(function () {
                $('.loginTabs ul li').removeClass('active');
                $(this).addClass('active');
                $('.loginForm').hide();
                $('#formMember').fadeIn('slow');
                $('#registerMessage').html(memberRegMessage);
                setCookie("loginURL", "0", new Date(Date.parse("Jan 1, 2050")));
            });

            $("#tab-group").click(function () {
                $('.loginTabs ul li').removeClass('active');
                $(this).addClass('active');
                $('.loginForm').hide();
                $('#formEmployer').fadeIn('slow');
                $('#registerMessage').html(employerRegMessage);
                setCookie("loginURL", "2", new Date(Date.parse("Jan 1, 2050")));
            });

            $("#tab-provider").click(function () {
                $('.loginTabs ul li').removeClass('active');
                $(this).addClass('active');
                $('.loginForm').hide();
                $('#formProvider').fadeIn('slow');
                $('#registerMessage').html(providerRegMessage);
                setCookie("loginURL", "3", new Date(Date.parse("Jan 1, 2050")));
            });

            $("#tab-agent").click(function () {
                $('.loginTabs ul li').removeClass('active');
                $(this).addClass('active');
                $('.loginForm').hide();
                $('#formAgent').fadeIn('slow');
                $('#registerMessage').html(agentRegMessage);
                setCookie("loginURL", "1", new Date(Date.parse("Jan 1, 2050")));
            });

            // Login box popup functionality    
            $(".login").click(function () {
                //alert('login disabled for testing...');
                $("#loginPopup").fadeIn('fast');
                $("#loginClose").show('fast');
            });
            $(".loginOpen").click(function () {
                $("#loginPopup").fadeOut('fast');
                $("#loginClose").hide('fast');
            });
            /* Removed -- we don't want the login box to fade out on mouse-out 
            $("#loginClose").mouseover(function() {
                $("#loginPopup").fadeOut('fast');
            $("#loginClose").hide('fast');
            }); 
            */
        });


        // function to enable smooth scrolling back to top
        $('.floatToTop').bind('click', function () {
            $('html, body').animate({
                scrollTop: 0
            }, $(window).scrollTop() / 3);
            return false;
        });

        //Temporaritly rewrite connecture links, until link is available.
        //jQuery("a[href='https://bcbsmibu.healthinsurance-asp.com']").attr("href", "/content/public/en/index/common/get-a-quote-outage.html");

        //call function that rewrites modal page paths on document ready -cmc 11/30/2012 1935
        modalPathRewrite();


    });

    //Scripts that need to run after everything else has loaded -cmc 11/30/2012 1215pm
    $(document).ready(function () {
        //call external link handler last
        if($('body.medicare').length===0){
            externalLinkHandler();
        }

        $('#modal-content').on('shown.bs.modal', function() {
            $("#txtname").focus();
        })

        $(document).on('shown.bs.modal', '#modalWindow', function (event) {
            $(this).removeClass('hide');
        })
        		
		//Handle contact us link change for provider/agent/etc.
		
		$(function() {
			var url = window.location.href,
			contactUsLink = $('#mainContactUsLink'),
			employerExp = new RegExp("\/employers(|/|\.html)", "g"),
			agentExp = new RegExp("\/agents(|/|\.html)", "g"),
			providerExp = new RegExp("\/providers(|/|\.html)", "g");

			if ( url.match(employerExp)||[].length >= 1 ){
			  contactUsLink.attr('href', '/content/public/en/employers/help/contacts.html');

			} 
			else if ( url.match(agentExp)||[].length >= 1 ){

			  contactUsLink.attr('href', '/content/public/en/agents/help/contacts.html');
			}
			else if ( url.match(providerExp)||[].length >= 1 ){
			  contactUsLink.attr('href', '/content/public/en/providers/help/contact-us.html');
			}

		  });

		
		
		
    });

    //MEMBER BANNER JS
    /*********************************** EASING ***********************************/
    //this is here to fix jquery UI easing... remove when member banner is removed.
    (function() {

    // based on easing equations from Robert Penner (http://www.robertpenner.com/easing)

    var baseEasings = {};

    $.each( [ "Quad", "Cubic", "Quart", "Quint", "Expo" ], function( i, name ) {
        baseEasings[ name ] = function( p ) {
            return Math.pow( p, i + 2 );
        };
    });

    $.extend( baseEasings, {
        Sine: function ( p ) {
            return 1 - Math.cos( p * Math.PI / 2 );
        },
        Circ: function ( p ) {
            return 1 - Math.sqrt( 1 - p * p );
        },
        Elastic: function( p ) {
            return p === 0 || p === 1 ? p :
                -Math.pow( 2, 8 * (p - 1) ) * Math.sin( ( (p - 1) * 80 - 7.5 ) * Math.PI / 15 );
        },
        Back: function( p ) {
            return p * p * ( 3 * p - 2 );
        },
        Bounce: function ( p ) {
            var pow2,
                bounce = 4;

            while ( p < ( ( pow2 = Math.pow( 2, --bounce ) ) - 1 ) / 11 ) {}
            return 1 / Math.pow( 4, 3 - bounce ) - 7.5625 * Math.pow( ( pow2 * 3 - 2 ) / 22 - p, 2 );
        }
    });

    $.each( baseEasings, function( name, easeIn ) {
        $.easing[ "easeIn" + name ] = easeIn;
        $.easing[ "easeOut" + name ] = function( p ) {
            return 1 - easeIn( 1 - p );
        };
        $.easing[ "easeInOut" + name ] = function( p ) {
            return p < 0.5 ?
                easeIn( p * 2 ) / 2 :
                1 - easeIn( p * -2 + 2 ) / 2;
        };
    });

    })();

    var memberBanner = memberBanner || {
        el: $('#panel'),
        handleEl: $('.handle-container'),
        setupEvents: function () {
            //open/close on click
            $("#handle").on( 'click', function(){
                memberBanner.toggle();
            });

            //action button animation
            $('.action-link').on( 'mouseover', function() {
                $('.action-button').stop().animate( { opacity: 0.35 }, { duration: 500 });
            }).on( 'mouseout', function(){
                $('.action-button').stop().animate( { opacity: 0.2 }, { duration: 500 });
            });
            
            //close button
            $('a.panel-close-button').on( 'click', function(){
                memberBanner.toggle();
            });
        },
        toggle: function () {

            $("#panel").slideToggle("slow", function(){
                //closing panel
                if ($(this).is(":hidden")){
                    $('.handleToggle').removeClass('minus');
                    $('.browser, .headings, .action-link, .action-button, #panel .drawer-content').each(function(index, el){
                        $(el).attr("style", "");
                    });
                }
                //opening panel
                else{
                    $('.handleToggle').addClass('minus');
                    //fade in background image
                    $('#panel .drawer-container').fadeIn();

                    //animate browser windows
                    $('.browser').each( function(index, el){
                        setTimeout( function () {
                            /*$(el).animate(
                                {"bottom" : '-5px'},
                                { easing: 'easeOutBounce', duration: 2000 }
                            );*/
                            $(el).animate( { 'bottom': '15px' }, 900, 'easeInSine' ).animate( { 'bottom': '-5px' }, 500, 'easeOutBounce' );
                        }, (300 * (index + 3)) - 1000);
                    });

                    //hashes that define each heading's vertical and horizontal position
                    var verticalHashes = {
                        0: 331,
                        1: 285,
                        2: 239,
                        3: 155,
                        4: 30
                    },
                    horizontalHashes = {
                        0: 690,
                        1: 690,
                        2: 690,
                        3: 665,
                        4: 665
                    };

                    //animate headings
                    $('.headings').each(function(index, el){
                        setTimeout(function () {
                            $(el).animate(
                                {"left": horizontalHashes[index] + "px", "top": verticalHashes[index] + "px"}, 
                                { easing: 'easeInOutQuint', duration: 1200 }
                            );
                        },  500 - (index * 200));
                    });

                    //fade in action button
                    var buttonPositions = {
                        0: '60px',
                        1: '50px'
                    }
                    $('.action-link, .action-button').each( function(index, el){
                        setTimeout(function () {
                            $(el).fadeIn().animate({
                                "bottom" : buttonPositions[index]
                            }, {easing: 'easeOutBounce', duration: 1000});
                        }, 1800);
                    });
                }
            });

        }
    };
    //END MEMBER BANNER JS


setTimeout(function(){
	$('body').tooltip({
			delay: { show: 300, hide: 0 },
			
			placement: function(tip, element) { //$this is implicit
				var position = $(element).position();
					if (position.left > 515) {
							return "left";
						}
					if (position.left < 515) {
							return "right";
						}
					if (position.top < 110) {
							return "bottom";
						}
					return "top";
			},
			selector: '[rel=tooltip]:not([disabled])' 
	},1000);
});



    function msieversion() {
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");

        if (msie > 0) {
            $('body').addClass('ext-ie');
        }

        return false;
    }

})(jQuery);



/* Placeholders.js v4.0.1 */
/*!
 * The MIT License
 *
 * Copyright (c) 2012 James Allardice
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
!function(a){"use strict";function b(){}function c(){try{return document.activeElement}catch(a){}}function d(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return!0;return!1}function e(a,b,c){return a.addEventListener?a.addEventListener(b,c,!1):a.attachEvent?a.attachEvent("on"+b,c):void 0}function f(a,b){var c;a.createTextRange?(c=a.createTextRange(),c.move("character",b),c.select()):a.selectionStart&&(a.focus(),a.setSelectionRange(b,b))}function g(a,b){try{return a.type=b,!0}catch(c){return!1}}function h(a,b){if(a&&a.getAttribute(B))b(a);else for(var c,d=a?a.getElementsByTagName("input"):N,e=a?a.getElementsByTagName("textarea"):O,f=d?d.length:0,g=e?e.length:0,h=f+g,i=0;h>i;i++)c=f>i?d[i]:e[i-f],b(c)}function i(a){h(a,k)}function j(a){h(a,l)}function k(a,b){var c=!!b&&a.value!==b,d=a.value===a.getAttribute(B);if((c||d)&&"true"===a.getAttribute(C)){a.removeAttribute(C),a.value=a.value.replace(a.getAttribute(B),""),a.className=a.className.replace(A,"");var e=a.getAttribute(I);parseInt(e,10)>=0&&(a.setAttribute("maxLength",e),a.removeAttribute(I));var f=a.getAttribute(D);return f&&(a.type=f),!0}return!1}function l(a){var b=a.getAttribute(B);if(""===a.value&&b){a.setAttribute(C,"true"),a.value=b,a.className+=" "+z;var c=a.getAttribute(I);c||(a.setAttribute(I,a.maxLength),a.removeAttribute("maxLength"));var d=a.getAttribute(D);return d?a.type="text":"password"===a.type&&g(a,"text")&&a.setAttribute(D,"password"),!0}return!1}function m(a){return function(){P&&a.value===a.getAttribute(B)&&"true"===a.getAttribute(C)?f(a,0):k(a)}}function n(a){return function(){l(a)}}function o(a){return function(){i(a)}}function p(a){return function(b){return v=a.value,"true"===a.getAttribute(C)&&v===a.getAttribute(B)&&d(x,b.keyCode)?(b.preventDefault&&b.preventDefault(),!1):void 0}}function q(a){return function(){k(a,v),""===a.value&&(a.blur(),f(a,0))}}function r(a){return function(){a===c()&&a.value===a.getAttribute(B)&&"true"===a.getAttribute(C)&&f(a,0)}}function s(a){var b=a.form;b&&"string"==typeof b&&(b=document.getElementById(b),b.getAttribute(E)||(e(b,"submit",o(b)),b.setAttribute(E,"true"))),e(a,"focus",m(a)),e(a,"blur",n(a)),P&&(e(a,"keydown",p(a)),e(a,"keyup",q(a)),e(a,"click",r(a))),a.setAttribute(F,"true"),a.setAttribute(B,T),(P||a!==c())&&l(a)}var t=document.createElement("input"),u=void 0!==t.placeholder;if(a.Placeholders={nativeSupport:u,disable:u?b:i,enable:u?b:j},!u){var v,w=["text","search","url","tel","email","password","number","textarea"],x=[27,33,34,35,36,37,38,39,40,8,46],y="#ccc",z="placeholdersjs",A=new RegExp("(?:^|\\s)"+z+"(?!\\S)"),B="data-placeholder-value",C="data-placeholder-active",D="data-placeholder-type",E="data-placeholder-submit",F="data-placeholder-bound",G="data-placeholder-focus",H="data-placeholder-live",I="data-placeholder-maxlength",J=100,K=document.getElementsByTagName("head")[0],L=document.documentElement,M=a.Placeholders,N=document.getElementsByTagName("input"),O=document.getElementsByTagName("textarea"),P="false"===L.getAttribute(G),Q="false"!==L.getAttribute(H),R=document.createElement("style");R.type="text/css";var S=document.createTextNode("."+z+" {color:"+y+";}");R.styleSheet?R.styleSheet.cssText=S.nodeValue:R.appendChild(S),K.insertBefore(R,K.firstChild);for(var T,U,V=0,W=N.length+O.length;W>V;V++)U=V<N.length?N[V]:O[V-N.length],T=U.attributes.placeholder,T&&(T=T.nodeValue,T&&d(w,U.type)&&s(U));var X=setInterval(function(){for(var a=0,b=N.length+O.length;b>a;a++)U=a<N.length?N[a]:O[a-N.length],T=U.attributes.placeholder,T?(T=T.nodeValue,T&&d(w,U.type)&&(U.getAttribute(F)||s(U),(T!==U.getAttribute(B)||"password"===U.type&&!U.getAttribute(D))&&("password"===U.type&&!U.getAttribute(D)&&g(U,"text")&&U.setAttribute(D,"password"),U.value===U.getAttribute(B)&&(U.value=T),U.setAttribute(B,T)))):U.getAttribute(C)&&(k(U),U.removeAttribute(B));Q||clearInterval(X)},J);e(a,"beforeunload",function(){M.disable()})}}(this),function(a,b){"use strict";var c=a.fn.val,d=a.fn.prop;b.Placeholders.nativeSupport||(a.fn.val=function(a){var b=c.apply(this,arguments),d=this.eq(0).data("placeholder-value");return void 0===a&&this.eq(0).data("placeholder-active")&&b===d?"":b},a.fn.prop=function(a,b){return void 0===b&&this.eq(0).data("placeholder-active")&&"value"===a?"":d.apply(this,arguments)})}(jQuery,this);