"use strict";

//create google event for confirm modal

class AddressInputValidator {
  constructor(input) {
    (this.valid = false),
      (this.validityTable = {
        hasZipCode: true,
        hasStateCode: true,
        hasProvinceCode: true,
        hasStateName: true,
        hasProvinceName: true,
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
    this.provinceCodes = [
      "AB",
      "BC",
      "MB",
      "NB",
      "NL",
      "NS",
      "ON",
      "PE",
      "QC",
      "SK",
    ];
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
      "Wyoming",
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
      "Yukon",
    ];
  }
  checkForPlacesApiChoice(ev) {
    const value = this.input.value;
    console.log(this.input.value);
  }
  handleInput() {
    //this.input.addEventListener("input", this.removeError.bind(this));
    if (!this.input.classList.contains("processed")) {
      this.input.addEventListener("keyup", this.removeError.bind(this));
      this.input.addEventListener("input", this.removeError.bind(this));
    }
    this.stateValue = this.input.value;

    this.validityTable.hasZipCode = this.checkForZipCode();
    this.validityTable.hasStateCode = this.checkForStateRefs(this.stateCodes);
    this.validityTable.hasProvinceCode = this.checkForStateRefs(
      this.provinceCodes
    );
    this.validityTable.hasStateName = this.checkForStateRefs(this.stateNames);
    this.validityTable.hasProvinceName = this.checkForStateRefs(
      this.provinceNames
    );
    this.validityTable.seemsValid = this.calculateValidity();
    this.input.classList.add("processed");
    if (localStorage.getItem("addressInputValidationLogging")) {
      console.log("Validity Table:", this.validityTable);
    }
    return this.validityTable.seemsValid;
  }
  //arbitrary checks for things that seem invalid
  calculateValidity() {
    //a score of 2 or higher results in an error
    //a score of 1 forces the user to manually validate the address
    let score = 0;
    //if our value has less than 3 parts, it most likely is not a valid address
    //OR if our value doesn't have any letters, it most likely is not a valid address
    if (
      this.stateValue.split(" ").length < 3 ||
      !/[a-zA-Z]/.test(this.stateValue)
    )
      score = 3;
    if (this.stateValue.split(" ").length > 5) {
      score++;
    }
    if (this.checkForCommas()) {
      score++;
    }
    if (
      this.validityTable.hasZipCode ||
      this.validityTable.hasStateCode ||
      this.validityTable.hasProvinceCode ||
      this.validityTable.hasStateName ||
      this.validityTable.hasProvinceName
    ) {
      score += 3;
    }
    //check score
    if (score === 0) return true;
    //if we have a score of 1, we need to ask the user to manually validate
    if (score === 1) {
      const dataLayer = window.dataLayer || [];
      if (!this.forceManualValidation()) {
        this.reportError(
          "Please enter a valid street address. Ex (123 Main St)."
        );
        this.emptyInputValue();
        dataLayer.push({ event: "userManualValidation" });
        return false;
      } else {
        this.userManuallyValidated = true;
        dataLayer.push({ event: "userManualValidation" });
        return true;
      }
    }
    if (score >= 2) {
      this.reportError(
        "Please enter a valid street address. Ex (123 Main St)."
      );
      this.emptyInputValue();
      return false;
    }
  }
  checkForCommas() {
    const commas = [...this.stateValue].filter((strChar) => strChar === ",");
    return commas?.length > 0 || false;
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
        //check if the index of the potential zip code is greater than the index of the comma (comma is before the potential zip code)
        //and also check to make sure the next character after the comma is not a letter
        if (
          this.stateValue.indexOf(zip) > index &&
          !this.nextCharIsLetter(index)
        ) {
          //if both conditions are true, we most-likely have a zip code enetered
          console.log(
            `found a zip code: ${zip} after a comma at index: ${index}`
          );
          return true;
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
    //check for numbers
    //if we have some, let's make sure they dont look like zip codes
    const addressArray = this.stateValue.split(" ");

    const numbers = addressArray.filter((element) => {
      if (element.includes(",")) element = element.replace(",", "");
      return /^[0-9]+$/.test(element);
    });
    const looksLikeZip = numbers.filter((element) => {
      //check for numbers that look like zip codes
      if (
        (element !== this.whiteListedZipCode &&
          /^\d{5}(?:[-\s]\d{4})?$/.test(element)) ||
        /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(
          element
        )
      ) {
        //if we have a match, check for a comma before it
        return element;
      }
    });
    if (looksLikeZip.length > 0) {
      //if the number that looks like a zip code has a comma before it, we most likely have a zip code
      //OR if the number that looks like a zip code is at the end of the value, we most likely have a zip code
      return (
        this.checkForPrecedingComma(looksLikeZip) ||
        this.input.value.endsWith(looksLikeZip[0])
      );
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
    this.input.value = "";
  }
  createError(msg) {
    this.error = document.createElement("div");
    const classes = ["validation", "validation--error"];
    this.error.id = "addressInputError";
    this.error.style.left = "0px";
    this.error.style.right = "auto";
    classes.forEach((className) => {
      this.error.classList.add(className);
    });
    const txt = document.createElement("span");
    txt.classList.add("validation__message");
    txt.textContent = msg;
    this.error.appendChild(txt);
    this.input.parentElement.appendChild(this.error);
  }
  removeError(ev) {
    if (document.querySelector("#addressInputError")) {
      this.error.closest(".formInput").classList.remove("showErrors");
      this.error.remove();
      // this.input.setCustomValidity("");
      // this.input.reportValidity();
    }
  }
  reportError(msg) {
    const errorExists = document.querySelector("#addressInputError");
    if (errorExists)
      this.error.closest(".formInput").classList.toggle("showErrors");
    this.createError(msg);
    const errorClasses = ["hasInteracted", "hasError", "showErrors"];
    errorClasses.forEach((className) => {
      this.error.closest(".formInput").classList.add(className);
    });
    // this.input.setCustomValidity(msg);
    // this.input.reportValidity();
  }
  enableSubmitButton() {
    this.input.parentElement
      .querySelector("button")
      .removeAttribute("disabled");
  }
}

export { AddressInputValidator };
