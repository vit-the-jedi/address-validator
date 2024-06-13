(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity)
      fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy)
      fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous")
      fetchOpts.credentials = "omit";
    else
      fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
class AddressInputValidator {
  constructor(input) {
    this.valid = false, this.validityTable = {
      hasZipCode: true,
      hasStateCode: true,
      hasProvinceCode: true,
      hasStateName: true,
      hasProvinceName: true,
      seemsValid: false
    }, this.stateValue = null, this.score = 0, this.input = input, this.error = null, this.stateCodes = [
      "AL",
      "AK",
      "AS",
      "AZ",
      "AR",
      "CA",
      "CO",
      "CT",
      "DE",
      "DC",
      "FL",
      "GA",
      "GU",
      "HI",
      "ID",
      "IL",
      "IN",
      "IA",
      "KS",
      "KY",
      "LA",
      "ME",
      "MD",
      "MA",
      "MI",
      "MN",
      "MS",
      "MO",
      "MT",
      "NE",
      "NV",
      "NH",
      "NJ",
      "NM",
      "NY",
      "NC",
      "ND",
      "MP",
      "OH",
      "OK",
      "OR",
      "PA",
      "PR",
      "RI",
      "SC",
      "SD",
      "TN",
      "TX",
      "UT",
      "VT",
      "VI",
      "VA",
      "WA",
      "WV",
      "WI",
      "WY"
    ];
    this.provinceCodes = ["AB", "BC", "MB", "NB", "NL", "NS", "ON", "PE", "QC", "SK"];
    this.stateNames = [
      "Alabama",
      "Alaska",
      "Arizona",
      "Arkansas",
      "California",
      "Colorado",
      "Connecticut",
      "Delaware",
      "Florida",
      "Georgia",
      "Hawaii",
      "Idaho",
      "Illinois",
      "Indiana",
      "Iowa",
      "Kansas",
      "Kentucky",
      "Louisiana",
      "Maine",
      "Maryland",
      "Massachusetts",
      "Michigan",
      "Minnesota",
      "Mississippi",
      "Missouri",
      "Montana",
      "Nebraska",
      "Nevada",
      "New Hampshire",
      "New Jersey",
      "New Mexico",
      "New York",
      "North Carolina",
      "North Dakota",
      "Ohio",
      "Oklahoma",
      "Oregon",
      "Pennsylvania",
      "Rhode Island",
      "South Carolina",
      "South Dakota",
      "Tennessee",
      "Texas",
      "Utah",
      "Vermont",
      "Virginia",
      "Washington",
      "West Virginia",
      "Wisconsin",
      "Wyoming"
    ];
    this.provinceNames = [
      "Alberta",
      "British Columbia",
      "Manitoba",
      "New Brunswick",
      "Newfoundland and Labrador",
      "Northwest Territories",
      "Nova Scotia",
      "Nunavut",
      "Ontario",
      "Prince Edward Island",
      "Quebec",
      "Saskatchewan",
      "Yukon"
    ];
  }
  async handleInput(event) {
    this.input.addEventListener("keyup", this.removeError.bind(this));
    this.stateValue = this.input.value;
    this.validityTable.hasZipCode = this.checkForZipCode();
    this.validityTable.hasStateCode = this.checkForStateRefs(this.stateCodes);
    this.validityTable.hasProvinceCode = this.checkForStateRefs(this.provinceCodes);
    this.validityTable.hasStateName = this.checkForStateRefs(this.stateNames);
    this.validityTable.hasProvinceName = this.checkForStateRefs(this.provinceNames);
    this.validityTable.seemsValid = await this.calculateValidity();
    console.log(this.validityTable.seemsValid);
    return this.validityTable.seemsValid;
  }
  //arbitrary checks for things that seem invalid
  calculateValidity() {
    return new Promise((resolve, reject) => {
      let score = 0;
      if (this.stateValue.split(" ").length > 5) {
        console.log("more than 5 words found, score +1");
        score++;
      }
      if (this.checkForCommas()) {
        console.log("commas found, score +1");
        score++;
      }
      if (this.validityTable.hasZipCode || this.validityTable.hasStateCode || this.validityTable.hasProvinceCode || this.validityTable.hasStateName || this.validityTable.hasProvinceName) {
        score += 3;
      }
      console.log(score);
      if (score === 0)
        resolve(true);
      if (score === 1) {
        if (!this.forceManualValidation()) {
          this.emptyInputValue();
          resolve(false);
        } else {
          this.userManuallyValidated = true;
          resolve(true);
        }
      }
      if (score >= 2) {
        this.emptyInputValue();
        resolve(false);
      }
    });
  }
  checkForCommas() {
    const commas = [...this.stateValue].filter((strChar, i, arr) => strChar === ",");
    if (commas.length > 0) {
      return true;
    }
    return false;
  }
  checkForPrecedingComma(potentialZipArray) {
    let indicesRemoved = 0;
    let stateValueCommaIndices = [];
    [...this.stateValue].forEach((strChar, i, arr) => {
      if (strChar === ",") {
        const index = arr.indexOf(strChar) + indicesRemoved;
        arr.splice(i, 1);
        indicesRemoved++;
        stateValueCommaIndices.push(index);
      }
    });
    if (stateValueCommaIndices.length === 0) {
      return false;
    }
    for (const zip of potentialZipArray) {
      for (const index of stateValueCommaIndices) {
        if (this.stateValue.indexOf(zip) > index && !this.nextCharIsLetter(index)) {
          console.log(`found a zip code: ${zip} after a comma at index: ${index}`);
          return zip;
        }
      }
    }
  }
  nextCharIsLetter(index) {
    const subStr = this.stateValue.substring(index + 1);
    for (const char of subStr) {
      const nextChar = subStr[subStr.indexOf(char) + 1];
      if (char === " ")
        continue;
      return /[a-zA-Z]/.test(nextChar);
    }
  }
  checkForStateRefs(arrayToCheckAgainst) {
    let regexStr = arrayToCheckAgainst.join("|");
    const stateMatchRegex = new RegExp(`\\b(${regexStr})\\b`, "gi");
    const stateMatches = this.stateValue.match(stateMatchRegex);
    if (stateMatches) {
      console.log(`state/province code/name found: ${stateMatches}`);
      return true;
    }
    return false;
  }
  checkForZipCode() {
    const addressArray = this.stateValue.split(" ");
    const numbers = addressArray.filter((element) => {
      if (element.includes(","))
        element = element.replace(",", "");
      return /^[0-9]+$/.test(element);
    });
    if (numbers.length > 1) {
      return true;
    }
    const looksLikeZip = numbers.filter((element) => {
      if (element !== this.whiteListedZipCode && /^\d{5}(?:[-\s]\d{4})?$/.test(element) || /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(element)) {
        return element;
      }
    });
    if (looksLikeZip.length > 0) {
      const probablyZipCode = this.checkForPrecedingComma(looksLikeZip);
      if (probablyZipCode) {
        return true;
      }
    } else {
      return false;
    }
  }
  forceManualValidation() {
    if (!this.userManuallyValidated)
      return confirm(
        'Looks like you may have entered a city, state, or zipcode. If you have entered a correct street address (ex: 123 Main St) without city, state, or zipcode, click "OK" to continue.'
      );
  }
  emptyInputValue(reasonData) {
    this.reportError(`Please enter only a street address without zipcode, city, or state. (ex: 123 Main St).`);
    this.input.value = "";
  }
  removeError() {
    this.input.setCustomValidity("");
    this.input.reportValidity();
  }
  reportError(msg) {
    this.input.setCustomValidity(msg);
    this.input.reportValidity();
  }
  enableSubmitButton() {
    this.input.parentElement.querySelector("button").removeAttribute("disabled");
  }
}
const init = (input) => {
  return new AddressInputValidator(input);
};
const addressInputValidator = init();
console.log(addressInputValidator);
