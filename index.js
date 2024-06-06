"use strict";
class AddressInputValidator {
  constructor(input) {
    (this.valid = false),
      (this.validityTable = {
        hasZipCode: true,
        hasStateCode: true,
        seemsValid: false,
      }),
      (this.stateValue = null),
      (this.score = 0),
      (this.input = input),
      (this.error = null),
      (this.stateCodes = [
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
        "WY",
      ]);
  }
  handleInput(event) {
    this.stateValue = this.input.value;
    if (!this.checkForStateCode()) {
      if (!this.checkForZipCode()) {
        if (!this.checkForCommas()) {
          return true;
        }
      }
    }
    return false;
  }
  checkForCommas() {
    const commas = [...this.stateValue].filter((strChar, i, arr) => strChar === ",");
    if (commas.length > 0) {
      this.reportError(`Please provide only a street address. ex (123 Main St), exclude city, state, and commas.`);
      return true;
    }
    return false;
  }
  checkForPrecedingComma(potentialZipArray) {
    let indicesRemoved = 0;
    let data = null;
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
        //check if the index of the zip code is greater than the index of the comma
        //and also check to make sure the next character after the comma is not a letter
        if (this.stateValue.indexOf(zip) > index && !this.nextCharIsLetter(index)) {
          //if both conditions are true, we most-likely have a zip code enetered
          console.log(`found a zip code: ${zip} after a comma at index: ${index}`);
          return zip;
        }
      }
    }
  }
  nextCharIsLetter(index) {
    //create a substring, starting at the next character after the comma
    const subStr = this.stateValue.substring(index + 1);
    for (const char of subStr) {
      const nextChar = subStr[subStr.indexOf(char) + 1];
      if (char === " ") continue;
      //test if the next char after the comma is a letter
      return /[a-zA-Z]/.test(nextChar);
    }
  }
  checkForStateCode() {
    const regexStr = this.stateCodes.join("|");
    const stateMatch = new RegExp(`(${regexStr})`);

    if (this.stateValue.match(stateMatch)) {
      console.log(`state code found: ${stateMatch}`);
      this.emptyInputValue({ reason: "stateCodeFound", value: stateMatch });
      return true;
    }
    return false;
  }
  checkForZipCode() {
    //check for numbers
    //if we have some, let's make sure they dont look like zip codes
    const addressArray = this.stateValue.split(" ");

    const numbers = addressArray.filter((element) => {
      if (element.includes(",")) element = element.replace(",", "");
      return /^[0-9]+$/.test(element);
    });
    if (numbers.length > 1) {
      this.emptyInputValue({ reason: "potentialZipCodeFound", value: numbers });
      return true;
    }
    const looksLikeZip = numbers.filter((element) => {
      //check for numbers that look like zip codes
      if (element !== this.whiteListedZipCode && /^\d{5}(?:[-\s]\d{4})?$/.test(element)) {
        //if we have a match, check for a comma before it
        return element;
      }
    });
    if (looksLikeZip.length > 0) {
      const probablyZipCode = this.checkForPrecedingComma(looksLikeZip);
      if (probablyZipCode) {
        this.emptyInputValue({ reason: "potentialZipCodeFound", value: probablyZipCode });
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  emptyInputValue(reasonData) {
    this.reportError(`Please enter only a street address without zip code, city, or state. (ex: 123 Main St).`);
    this.input.value = "";
    setTimeout(() => {
      this.removeError();
    }, 5000);
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
