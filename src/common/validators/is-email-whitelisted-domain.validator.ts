import { registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";

const WHITELISTED_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "yahoo.es",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "zoho.com",
  "yandex.com",
  "yandex.ru",
  "gmx.com",
  "gmx.de",
  "fastmail.com",
  "mail.com",
  "tutanota.com",
];

export function IsEmailWhitelistedDomain(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isEmailWhitelistedDomain",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") return false;
          const domain = value.split("@")[1];
          return WHITELISTED_DOMAINS.includes(domain);
        },
        defaultMessage(args: ValidationArguments) {
          return "That email domain is not permitted. Please use a domain validated by the system.";
        },
      },
    });
  };
}
