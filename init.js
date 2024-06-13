"use strict";
import { AddressInputValidator } from "./index.js";
const init = (input) => {
  return new AddressInputValidator(input);
};

export { init };
