import config from "@aditosoftware/eslint-config-adito-platform";

export default [
  ...config,
  
  {
    rules: {
      "@typescript-eslint/no-namespace": "off",
    },
  },
];
