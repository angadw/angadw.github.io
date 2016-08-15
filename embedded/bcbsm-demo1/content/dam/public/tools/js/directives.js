'use strict';

angular.module('bcbsmApp').directive('subsidyLink', ['$compile', 
	function($compile) {
		return {
			restrict: 'AE',
			link: function(scope, element, attrs) {
				element.bind('click', function(event) {
					event.stopPropagation();
					event.preventDefault();
					
					$('#subsidyModal').modal('show').removeClass('hide');
					$('#subsidyModal a').each(function () {
		                $(this).removeClass('external').removeClass('internal').removeClass('bcbsmLink');
		                $(this).unbind('click');
		            });

		            $('#subsidyModal .eligible.medicaid a').each(function () {
		                $(this).addClass('external');

		                var message =
		                "Please note that you\'re leaving the Blue Cross Blue Shield of Michigan website. \n\n" +
		                "While we recommend this site, we\'re required to let you know we\'re not responsible for its content.";

		                $(this).click(function (event) {
			              event.preventDefault();
			              event.stopPropagation();
			              var answerOk = confirm(message);
			              if (answerOk) {
			                window.open(this.href, '_blank');
			              }
			            });
		            });
				});
			}
		};
	}
]);