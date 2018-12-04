const autoprefixer = require('autoprefixer');
const gulp = require('gulp');
const cssmin = require('gulp-cssmin');
const header = require('gulp-header');
const less = require('gulp-less');
const postcss = require('gulp-postcss');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const rollup = require('rollup-stream');
const resolve = require('rollup-plugin-node-resolve');
const buble = require('rollup-plugin-buble');
const commonjs = require('rollup-plugin-commonjs');
const { eslint } = require('rollup-plugin-eslint');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const pkg = require('./package.json');

const banner = `
/**
 * mdui-editor ${pkg.version} (${pkg.homepage})
 * Copyright 2019-${new Date().getFullYear()} ${pkg.author}
 * Licensed under ${pkg.license}
 */
`.trim();

gulp.task('css', (cb) => {
  gulp.src('./src/index.less')
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(postcss([
      autoprefixer(),
    ]))
    .pipe(header(banner))
    .pipe(rename('mduiEditor.css'))
    .pipe(gulp.dest('./dist/'))
    .pipe(cssmin())
    .pipe(rename('mduiEditor.min.css'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/'))
    .on('end', cb);
});

gulp.task('js', (cb) => {
  rollup({
    input: './src/index.js',
    output: {
      name: 'mduiEditor',
      format: 'umd',
      banner,
      globals: {
        'mdui': 'mdui',
      },
    },
    rollup: require('rollup'), // rollup-stream 内置的 rollup 版本太低，与 rollup-plugin-commonjs v9 不兼容。在这里使用指定的 rollup
    plugins: [
      resolve(),
      commonjs(),
      eslint(),
      buble(),
    ],
    external: ['mdui'],
  })
    .pipe(source('index.js', './src'))
    .pipe(buffer())
    .pipe(rename('mduiEditor.js'))
    .pipe(gulp.dest('./dist/'))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(header(banner))
    .pipe(rename('mduiEditor.min.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/'))
    .on('end', cb);
});

gulp.task('default', ['css', 'js']);
