module.exports = {
	'env': {
		'browser': true,
		'es2020': true
	},
	'extends': [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended'
	],
	'overrides': [
		{
			'env': {
				'node': true
			},
			'files': [
				'.eslintrc.{js,cjs}'
			],
			'parserOptions': {
				'sourceType': 'script'
			}
		}
	],
	'parser': '@typescript-eslint/parser',
	'parserOptions': {
		'ecmaVersion': 'latest',
		'sourceType': 'module'
	},
	'plugins': [
		'@typescript-eslint',
		'prefer-arrow'
	],
	'rules': {
		'default-case-last': [
			'error'
		],
		'indent': [
			'error',
			'tab'
		],
		'linebreak-style': [
			'off',
			'windows'
		],
		'no-invalid-this': [
			'error'
		],
		'no-param-reassign': [
			'error'
		],
		'no-useless-rename': [
			'error'
		],
		'no-var': [
			'error'
		],
		'prefer-arrow-callback': [
			'error'
		],
		'prefer-const': [
			'warn'
		],
		'quotes': [
			'error',
			'single'
		],
		'semi': [
			'error',
			'always'
		],
		
		// Prefer arrow
		'prefer-arrow/prefer-arrow-functions': [
			'error',
			{
				'disallowPrototype': false,
				'singleReturnOnly': false,
				'classPropertiesAllowed': false
			}
		]
	}
};
