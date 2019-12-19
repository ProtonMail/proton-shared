module.exports = {
    globals: {
        FEATURE_FLAGS: ''
    },
    setupFilesAfterEnv: ['./rtl.setup.js'],
    verbose: true,
    moduleDirectories: ['node_modules'],
    transform: {
        '^.+\\.(js|tsx?)$': 'babel-jest'
    },
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
    transformIgnorePatterns: ['node_modules/(?!(proton-shared)/)']
};
