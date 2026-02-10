import nextConfig from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const config = [
	{
		ignores: [".agent/**", ".agents/**", ".claude/**", "**/node_modules/**", ".next/**"],
	},
	...nextConfig,
	{
		rules: {
			"no-unused-vars": "off",
			"react/no-unescaped-entities": "off",
			"@next/next/no-html-link-for-pages": "off",
		},
	},
];

export default config;
