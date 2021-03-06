

function SpincheckerNN() {

	

	/** PUBLIC PROPERTIES ************************************************************************/

	

	this.rateMargin = 6; // percents

	this.minCustomerSentences = 4,

	this.aUploadedFileNames = [];

	this.maxSentenceChars = 65000;

	

	/** PRIVATE PROPERTIES ***********************************************************************/



	var _this = this,

		minValue = 50 - this.rateMargin, // percents 

		maxValue = 50 + this.rateMargin, // percents

		minNeutralSentences = 1,

		justGageUniqueId = 1,

		requiredNbSentencesPerParagraph = 7;

		$standardMessageTpl = $('' +

			'<div class="grid">' +

				'<div class="unit whole">' +

					'<div class="info-message result"></div>' +

				'</div>' +

			'</div>'),

		$neutralSentenceTpl = $('' +

			'<div class="grid">' +

				'<div class="unit three-quarters" style="display:table">' +

					'<div class="info-message result" style="display:table-cell; vertical-align:middle; height:60px"></div>' +

				'</div>' +

				'<div class="unit one-quarter">&nbsp;</div>' +

			'</div>'),

		$customerSentenceTpl = $('' +

			'<div class="grid">' +

				'<div class="unit three-quarters" style="display:table">' +

					'<div class="info-message result" style="display:table-cell; vertical-align:middle; height:60px"></div>' +

				'</div>' +

				'<div class="unit one-quarter">' +

					'<div class="gauge" style="height:60px"></div>' +

				'</div>' +

			'</div>');

	

	/** PUBLIC METHODS ***************************************************************************/

		

	this.init = function( ){

		this.aUploadedFileNames = [];

		justGageUniqueId = 1;

	}



	/**

	 * @param masterSpin

	 * @param keyword

	 * @param ignoreFirstSentence

	 */

	this.analyzeMasterSpin = function(masterSpin, keyword, ignoreFirstSentence) {

		var toggleTitle,

			isUploadMode = (_this.aUploadedFileNames.length ? true : false );

		

//		displayResultMessageType1($standardMessageTpl, "info", "Pourcentage de spuns avec mot-cl� vis� : entre " + minValue + "% et " + maxValue + "%", false);

		$.each(masterSpin.split('\n\n'), function(i,paragraphSpintax) {

			toggleTitle = ( isUploadMode ? MySpeech.get("message.file") + ' ' + _this.aUploadedFileNames[i] : MySpeech.get("message.paragraph_number") + ' ' + parseInt(i+1) );

			$("<div class='db-toggle' data-title='" + toggleTitle + "'>").appendTo("#div-checkspin-results");

			analyzeParagraph(i, paragraphSpintax, keyword, ignoreFirstSentence);

			$("</div>").appendTo("#div-checkspin-results");

		});

		

		if ( isUploadMode ) {

			sortTogglesAlphabetically();

		}

		createToggles($('#div-checkspin-results'), true, false, false);

		renderGauges();

	}

	

	/** PRIVATE METHODS **************************************************************************/

	

	function analyzeParagraph(noParagraph, paragraphSpintax, keyword, ignoreFirstSentence) {

		var nbSentencesPerParagraph = paragraphSpintax.split('\n').length,

			customerSentences = 0,

			neutralSentences = 0,

			checkSentenceResult, 

			spunsWithKeywordRate,

			objMessage,

			messageType,

			message;

		

		$.each(paragraphSpintax.split('\n'), function(i,sentence) {

			if ( !i && ignoreFirstSentence ) {

				displayResultMessageType1($standardMessageTpl, "info", MySpeech.get("message.success.first_sentence_ignored"));

			}

			else {

				checkSentenceResult = checkSentenceUsingProbabilities(sentence, keyword);

//				checkSentenceResult = checkSentenceUsingStatistics(v, keyword);

				// Phrase de type client

				if ( checkSentenceResult.isCustomerSentence ) {

					customerSentences++;

					objMessage = getMessageForCustomerSentence(i+1, checkSentenceResult.spunsWithKeywordRate, sentence);

					displayResultMessageType2(objMessage.type, objMessage.text, checkSentenceResult.spunsWithKeywordRate);

				}

				// Phrase de type neutre

				else {

					neutralSentences++;

					objMessage = getMessageForNeutralSentence(i+1, sentence);

					displayResultMessageType1($neutralSentenceTpl, objMessage.type, objMessage.text);

				}

			}

		});

		

		messageType = ( (nbSentencesPerParagraph == requiredNbSentencesPerParagraph) && (customerSentences >= _this.minCustomerSentences) && (neutralSentences >= minNeutralSentences) ? "success" : "error" );

		message = "" +

			MySpeech.get("message.this_paragraph_contains") + " " + customerSentences + " " + MySpeech.get("message.customer_sentences_for_a_minimum_of") + " " + _this.minCustomerSentences + MySpeech.get("message.paragraph_sep") + " " +

			MySpeech.get("message.neutral_et")+ " " + neutralSentences + " " + MySpeech.get("message.neutral_sentences_for_a_minimum_of") + " " + minNeutralSentences + ". " + 

			(nbSentencesPerParagraph != requiredNbSentencesPerParagraph ? MySpeech.get("message.this_paragraph_contains") + " " + nbSentencesPerParagraph + " " + MySpeech.get("message.sentences_for_a_require_count_of") + " " + requiredNbSentencesPerParagraph + "." : "" ) ;

		displayResultMessageType1($standardMessageTpl, messageType, message);

		

		// Action buton deactivation

		$('#action-button').addClass('disabled').off('click');

	}

	

	function getMessageForCustomerSentence(noSentence, spunsWithKeywordRate, sentence) {

		var text = MySpeech.get("message.sentence_number") + " " + noSentence + " " + MySpeech.get("message.is_customer_sentence"),

			errorDetected = false;

		

		if ( spunsWithKeywordRate < minValue || spunsWithKeywordRate > maxValue ) {

			errorDetected = true;

		}

		text += MySpeech.get("message.semicolon_space") + MySpeech.get("message.it_generates") + " " + spunsWithKeywordRate.replace('.', ',') + "% " + MySpeech.get("message.spuns_containing_keyword");

		

		if ( $('#check-sentence-length').is(":checked") && sentence.length > _this.maxSentenceChars ) {

			errorDetected = true;

			text += MySpeech.get("message.semicolon_space") + MySpeech.get("message.it_has_more_than") + " " + addThousandsSeparator(_this.maxSentenceChars) + " " + MySpeech.get("message.characters");

		}

		

		text += ".";

		return { text:text, type:(errorDetected ? 'error' : 'success')};

	}



	function getMessageForNeutralSentence(noSentence, sentence) {

		var text = MySpeech.get("message.sentence_number") + " " + noSentence + " " + MySpeech.get("message.is_neutral_sentence"),

			errorDetected = false;



		if ( $('#check-sentence-length').is(":checked") && sentence.length > _this.maxSentenceChars ) {

			errorDetected = true;

			text += MySpeech.get("message.semicolon_space") + MySpeech.get("message.it_has_more_than") + " " + addThousandsSeparator(_this.maxSentenceChars) + " " + MySpeech.get("message.characters");

		}



		text += ".";

		return { text:text, type:(errorDetected ? 'error' : 'success')};

	}

	

	function displayResultMessageType1($tpl, messageType, message, addToToggleContent) {

		var addToToggleContent = addToToggleContent || true,

			$appendTo = ( addToToggleContent ? $('.db-toggle').last() : $('#div-checkspin-results') ),

			$tplClone = $tpl.clone();

	

		$tplClone.find('.info-message').addClass(messageType).html(message);

		if ( messageType == "error") {

			$tplClone.find('.info-message').wrapInner("<div class='blink'></div>");

		}

		$tplClone.appendTo($appendTo);

	}



	function displayResultMessageType2(messageType, message, spunsWithKeywordRate, addToToggleContent) {

		var addToToggleContent = addToToggleContent || true,

			$appendTo = ( addToToggleContent ? $('.db-toggle').last() : $('#div-checkspin-results') ),

			$tplClone = $customerSentenceTpl.clone();

		

		$tplClone.find('.info-message').addClass(messageType).html(message);

		$tplClone.find('.gauge').attr('id', 'gage-' + justGageUniqueId++).attr('gauge-value', spunsWithKeywordRate);

		$tplClone.appendTo($appendTo);

	}



	function getKeywordDepthInSpintaxSentence(spintaxSentence, indexMatch) {

		var keywordDepth = 0;

		for ( var i=0; i<indexMatch; i++ ) {

			if ( spintaxSentence[i] == '{' ) {

				keywordDepth++;

			}

			if ( spintaxSentence[i] == '}' ) {

				keywordDepth--;

			}

		}

		return keywordDepth;

	}



	function getKeywordNbChoicesInSpintaxSentence(spintaxSentence, keywordDepth, keywordLength, indexMatch) {

		var keywordNbChoices = 1;

		if ( keywordDepth ) {

			var tmpDepth = 0,

				stopProcessing = false;

			for ( var i=0; i<spintaxSentence.length; i++ ) {

				if ( stopProcessing ) {

					break;

				}

//				console.log(i, spintaxSentence[i])

				switch ( spintaxSentence[i] ) {

				case '{': 

					tmpDepth++;

					break;

				case '}':

					if ( tmpDepth == keywordDepth ) {

						if ( i < indexMatch ) {

							keywordNbChoices = 1;

						}

						if ( i >= indexMatch + keywordLength) {

//							console.log("stopProcessing !")

							stopProcessing = true;

						}

					}

					tmpDepth--;

					break;

				case '|': 

					if ( tmpDepth == keywordDepth ) { 

						keywordNbChoices++; 

					};

					break;

				}

			}

		}

//		console.log("keywordNbChoices", keywordNbChoices)

		return keywordNbChoices;

	}



	function checkSentenceUsingProbabilities(spintaxSentence, keyword) {

		var aProbabilities = [],

			keywordDepth,

			totalNbChoices,

			regexpPattern = ( $('#ignore-keyword-between-quotes').is(":checked") 

//				? '"\\s*' + keyword + '|�\\s*' + keyword + '|' + keyword + '\\s*"|' + keyword + '\\s*�|(' + keyword + ')' // we only capture what we need at the end

//				? '"\\s*' + keyword + '|' + keyword + '\\s*"|�.*' + keyword + '.*�|(\\b' + keyword + '\\b)' // we only capture what we need at the end

//				? '�.*' + keyword + '.*�|(\\b' + keyword + '\\b)' // we only capture what we need at the end

				? '�(?:[^�]*)' + keyword + '(?:[^�]*)�|(\\b' + keyword + '\\b)' // we use capturing groups to exclude what we don't need, in order to finally capture what we need

				: '(\\b' + keyword + '\\b)' ), // boundaries are used to match word only

			regexpFlags = ( $('#keyword-search-is-case-sensitive').is(":checked") ? 'g' : 'gi' ),

//			oRegexp = new RegExp(regexpPattern,regexpFlags),

			aMatches = getRegexpMatches(new RegExp(regexpPattern,regexpFlags), spintaxSentence, 1),

			result = { isCustomerSentence: (aMatches.length > 0), spunsWithKeywordRate: null };



//		console.log("regexpPattern", regexpPattern);

//		console.log(aMatches); // JSI 

		if ( !result.isCustomerSentence ) {

			return result;

		}

		

		/*

		oRegexp.lastIndex = 0;

		while ((oRegexp.exec(spintaxSentence)) !== null) {

			console.log(regexpPattern)

			indexMatch = oRegexp.lastIndex - keyword.length;

//			console.log(">>> indexMatch", indexMatch);

			keywordDepth = getKeywordDepthInSpintaxSentence(spintaxSentence, indexMatch);

//			console.log("keywordDepth", keywordDepth);

			totalNbChoices = 1;

			for ( var depth=1; depth<=keywordDepth; depth++ ) {

				totalNbChoices *= getKeywordNbChoicesInSpintaxSentence(spintaxSentence, depth, keyword.length, indexMatch);

			}

//			console.log("totalNbChoices", totalNbChoices);

			aProbabilities.push(1/totalNbChoices);

		}

		*/

		$.each(aMatches, function(i,match){

			keywordDepth = getKeywordDepthInSpintaxSentence(spintaxSentence, match.index);

			totalNbChoices = 1;

			for ( var depth=1; depth<=keywordDepth; depth++ ) {

				totalNbChoices *= getKeywordNbChoicesInSpintaxSentence(spintaxSentence, depth, keyword.length, match.index);

			}

			aProbabilities.push(1/totalNbChoices);

		})

		

//		console.log("aProbabilities", aProbabilities);

		for ( var i=0; i<aProbabilities.length; i++ ) {

			if ( aProbabilities[i] == 1 ) {

				result.spunsWithKeywordRate = 1;

				break;

			}

			result.spunsWithKeywordRate += aProbabilities[i];

		}

		result.spunsWithKeywordRate = new String(parseFloat((100 * result.spunsWithKeywordRate).toFixed(1)));

//		console.log("spunsWithKeywordRate", result.spunsWithKeywordRate);

		return result;

	}



	/**

	 * @param {Object} oRegexp

	 * @param {string} string

	 * @param {integer} [noCapturingGroup] : n� of the capturing group to extract

	 */

	function getRegexpMatches(oRegexp, string, noCapturingGroup) {

		var noCapturingGroup = noCapturingGroup || 0,

			aResult = [],

			result,

			match = oRegexp.exec(string);

		

		if ( match ) {

			while ( match ) {

				// matched text: match[0]

				// match start: match.index

				// capturing group n: match[n]

				result = { index:match.index, text:match[0] };

				if ( noCapturingGroup ) {

					if ( match[noCapturingGroup] !== undefined ) {

						result['cg' + noCapturingGroup] = match[noCapturingGroup];

						aResult.push(result);

					}

				}

				else {

					aResult.push(result);

				}

				match = oRegexp.exec(string);

			}

		}

		

		return aResult;

	}

	

	function sortTogglesAlphabetically() {

		$('.db-toggle').sortElements(function(a, b){

			return $(a).data('title').localeCompare($(b).data('title'));

		});

	}

	

	/**

	 * @deprecated

	 */

	function OLD_checkSentenceUsingProbabilities(spintaxSentence, keyword) {

		var aProbabilities = [],

			keywordDepth,

			indexMatch,

			totalNbChoices,

			regexpPattern = ( $('#ignore-keyword-between-quotes').is(":checked") ? keyword + '(?!("| "|�| �))' : keyword ), // ?! means "not followed by"

			regexpFlags = ( $('#keyword-search-is-case-sensitive').is(":checked") ? 'g' : 'gi' ),

			oRegexp = new RegExp(regexpPattern,regexpFlags),

			result = { isCustomerSentence: oRegexp.test(spintaxSentence), spunsWithKeywordRate: 0 };

		

		if ( !result.isCustomerSentence ) {

			return result;

		}

		

		oRegexp.lastIndex = 0;

		while ((oRegexp.exec(spintaxSentence)) !== null) {

			indexMatch = oRegexp.lastIndex - keyword.length;

//			console.log(">>> indexMatch", indexMatch);

			keywordDepth = getKeywordDepthInSpintaxSentence(spintaxSentence, indexMatch);

//			console.log("keywordDepth", keywordDepth);

			totalNbChoices = 1;

			for ( var depth=1; depth<=keywordDepth; depth++ ) {

				totalNbChoices *= getKeywordNbChoicesInSpintaxSentence(spintaxSentence, depth, keyword.length, indexMatch);

			}

//			console.log("totalNbChoices", totalNbChoices);

			aProbabilities.push(1/totalNbChoices);

		}

		

//		console.log("aProbabilities", aProbabilities);

		for ( var i=0; i<aProbabilities.length; i++ ) {

			if ( aProbabilities[i] == 1 ) {

				result.spunsWithKeywordRate = 1;

				break;

			}

			result.spunsWithKeywordRate += aProbabilities[i];

		}

		result.spunsWithKeywordRate = new String(parseFloat((100 * result.spunsWithKeywordRate).toFixed(1)));

//		console.log("spunsWithKeywordRate", result.spunsWithKeywordRate);

		return result;

	}

	

	function renderGauges() {

		$('.gauge').each(function(i,v) {

			new JustGage({

				id: $(this).attr('id'),

				value: parseFloat($(this).attr('gauge-value')),

				decimals: 1,

				min: 0,

				max: 100,

				label: "%",

				gaugeWidthScale: 0.25,

				customSectors: [{

					color: "#ce4844",

					lo: 0,

					hi: minValue

				},{

					color: "#ff8040",

					lo: minValue,

					hi: 49.9

				},{

					color: "#5cb85c",

					lo: 49.9,

					hi: 50.1

				},{

					color: "#ff8040",

					lo: 50.1,

					hi: maxValue

				},{

					color: "#ce4844",

					lo: maxValue,

					hi: 100

				}]

			});

		});

	}

	

	/**

	 * @deprecated

	 * @param spintaxSentence

	 * @param keyword

	 */

	function checkSentenceUsingStatistics(spintaxSentence, keyword) {

		var nbSentencesForStatisticsMethod = 10000,

			oRegexp = new RegExp(keyword,"i"),

			result = { isCustomerSentence: oRegexp.test(spintaxSentence), spunsWithKeywordRate: 0 };

		if ( !result.isCustomerSentence ) {

			return result;

		}



		var tree = SpinerMan.buildTreeWithNoStats(spintaxSentence),

			spunsWithKeyword = 0,

			totalSpuns = tree.r,

			nbStatisticalSamples = Math.min(totalSpuns, nbSentencesForStatisticsMethod),

			tmpRate;

//		console.log(">>>>>>>>>>>>> totalSpuns", totalSpuns)

		var aVariationsindexes = generateVariationsIndexes(totalSpuns, nbStatisticalSamples);

//		console.log(aVariationsindexes);

		for (var i=1; i<=nbStatisticalSamples; i++) {

//			var j = getRandomIntFromInterval(0, totalSpuns-1);

			var j = aVariationsindexes[i-1];

			var v = SpinerMan.getVariation(tree, j);

			if ( oRegexp.test(v) ) {

				spunsWithKeyword++;

			}

		}

//		console.log(">>> ", spunsWithKeyword, " out of ", nbStatisticalSamples);

		tmpRate = (spunsWithKeyword  / nbStatisticalSamples) * 100;

		result.spunsWithKeywordRate = (parseInt(tmpRate) == tmpRate ? parseInt(tmpRate) : tmpRate.toFixed(1) );

		return result;

	}



	/**

	 * @deprecated

	 */

	function getRandomIntFromInterval(min,max) {

		return Math.floor(Math.random()*(max-min+1)+min);

	}



	/**

	 * @deprecated

	 * @param totalSpuns

	 * @param nbVariations

	 * @returns {Array}

	 */

	function generateVariationsIndexes(totalSpuns, nbVariations) {

		var interval = totalSpuns / (nbVariations+1),

			result = [],

			index = 0;

		for (var i=0; i<nbVariations; i++) {

			index += interval;

			result.push(Math.floor(index));

		}

		return result;

	}



	/**

	 * @deprecated

	 */

	function buildArrayMatches(spintaxSentence, keyword) {

		var oRegexp = new RegExp(keyword,'g'),

			aKeywordIndexMatches = [],

			aResult = [],

			indexMatch,

			absoluteDepth = 0,

			lastKeywordDepth = -1,

			isSameExpression = false;

		

		while ((oRegexp.exec(spintaxSentence)) !== null) {

			aKeywordIndexMatches.push(oRegexp.lastIndex - keyword.length);

		}

		for ( var i=0; i<spintaxSentence.length; i++ ) {

			if ( !aKeywordIndexMatches.length ) {

				break;

			}

			if ( i == aKeywordIndexMatches[0] ) {

//				console.log("match pour i =", i, "isSameExpression", isSameExpression);

				indexMatch = aKeywordIndexMatches.shift();

				if ( !isSameExpression ) {

					aResult.push(indexMatch);

					lastKeywordDepth = absoluteDepth;

//					console.log("PUSHED", indexMatch, "lastKeywordDepth", lastKeywordDepth)

				}

				isSameExpression = true;

			}

			switch ( spintaxSentence[i] ) {

				case '{': absoluteDepth++; break;

				case '}': absoluteDepth--; break;

				case '|':

//					console.log("| detected at", i, "absoluteDepth =", absoluteDepth, "lastKeywordDepth =", lastKeywordDepth);

					if ( absoluteDepth == lastKeywordDepth ) {

						isSameExpression = false;

					}

					break;	

			}

		}

			

		return aResult;

	}



}



var SpincheckerNN = new SpincheckerNN();



/*************************************************************************************************/



function initForm() {
	

	resetForm();

}



function resetForm() {

	hideHelp();

	SpincheckerNN.init();

	//$('#ignore-keyword-between-quotes').prop('checked', true);

	//$('#keyword-search-is-case-sensitive').prop('checked', true);

	$('#min-customer-sentences option:eq(3)').prop('selected', true);

	updateHelpInfos();

	$('#ignore-first-sentence').prop('checked', true);

	$('#check-sentence-length').prop('checked', true);

	$('#master-spin').val('');

	$('#div-checkspin-results').empty()

	$('#action-button').removeClass('disabled').on('click', submitForm);

	$('#keyword').focus();

}



function updateHelpInfos() {

	SpincheckerNN.minCustomerSentences = $('#min-customer-sentences').val();

	$('span#help-min-customer-sentences').html( SpincheckerNN.minCustomerSentences + ' phrase' + (SpincheckerNN.minCustomerSentences > 1 ? 's': ''));

	$('span#help-max-sentence-chars').html( SpincheckerNN.maxSentenceChars );

}



function submitForm() {

	var keyword = $('#keyword').val().trim(), 

		masterSpin = $('#master-spin').val().trim();

	

	if ( !keyword ) {

		MyUtils.displayInfoMessage('warning', MySpeech.get("message.warning.please_enter_keyword"));

		$('#keyword').focus();

		return;

	}

	if ( !masterSpin ) {

		MyUtils.displayInfoMessage('warning', MySpeech.get("message.warning.please_enter_master_spin"));

		$('#master-spin').focus();

		return;

	}

	/*keyword = removeDiacritics(keyword);
	keyword = keyword.replace(/ /g,"~");
	masterSpin = removeDiacritics(masterSpin);
	masterSpin = masterSpin.replace(/ /g,"~");

	console.log(keyword+"!");
	console.log(masterSpin+"!");*/
	
	keyword = convertUnicodeToSimple(keyword);
	keyword = keyword.replace(/#/g,"_");
	keyword = keyword.replace(/&/g,"__");
	keyword = keyword.replace(/;/g,"___");
	//keyword = keyword.replace(/-/g,"~");
	
	//keyword = keyword.replace(/ /g,"~");
	//keyword = RegExp.escape(keyword);
	
	masterSpin = convertUnicodeToSimple(masterSpin);
	masterSpin = masterSpin.replace(/#/g,"_");
	masterSpin = masterSpin.replace(/&/g,"__");
	masterSpin = masterSpin.replace(/;/g,"___");
	//masterSpin = masterSpin.replace(/ /g,"~");
	//masterSpin = RegExp.escape(masterSpin);
	//masterSpin = masterSpin.replace(/-/g,"~");
	
	console.log(keyword+"!");
	console.log(masterSpin+"!");
	/*
	keyword = keyword.toUnicode();
	//keyword = keyword.replace(/ /g,"~");
	masterSpin = masterSpin.toUnicode();
	//masterSpin = masterSpin.replace(/ /g,"~");

	console.log(keyword+"!");
	console.log(masterSpin+"!");
	*/
	
	$('#div-checkspin-results').empty();
	
	SpincheckerNN.analyzeMasterSpin(masterSpin, keyword, $('#ignore-first-sentence').is(":checked"));

}



function showHelp() {

	$('.info-message[class~=help]').slideUp(400, function() {

		$(this).find('.help-content').html( MySpeech.get("application.help").join("") );

		$('span#rate-margin').html(SpincheckerNN.rateMargin);

		updateHelpInfos();

		$(this).find('.close-button a').html("<i class='fa fa-fw fa-chevron-up'></i> " + MySpeech.get("hide_help", true)).off('click').on('click', hideHelp);

		$(this).slideDown(400);

	});

	

}



function hideHelp() {

	$('.info-message[class~=help]').slideUp(400, function() {

		$(this).find('.help-content').html('');

		$(this).find('.close-button a').html("<i class='fa fa-fw fa-chevron-down'></i> " + MySpeech.get("show_help", true)).off('click').on('click', showHelp);

		$(this).slideDown(400);

	});

}

function addThousandsSeparator(input) {
    var output = input
    if (parseFloat(input)) {
        input = new String(input); // so you can perform string operations
        var parts = input.split("."); // remove the decimal part
        parts[0] = parts[0].split("").reverse().join("").replace(/(\d{3})(?!$)/g, "$1,").split("").reverse().join("");
        output = parts.join(".");
    }

    return output;
}


function convertUnicodeToSimple(str)
{
 var encodedStr = str.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
   return '&#'+i.charCodeAt(0)+';';
 });
 return encodedStr;
}
