'use strict' // eslint-disable-line strict

const del = require('del')
const fs = require('fs')
const gulp = require('gulp')
const babel = require('gulp-babel')
const replace = require('gulp-replace')
const util = require('util')
const packageInfo = require('./package.json')

const compatibleVersionRange = `${packageInfo.version.split('.').shift()}.x`

function clean() {
  return del('./dist')
}

async function injectLoader(done) {
  const readFile = fileName => util.promisify(fs.readFile)(fileName, 'utf-8')
  const writeFile = (fileName, contents) => util.promisify(fs.writeFile)(fileName, contents, 'utf-8')

  const [loader, component] = await Promise.all([
    require.resolve('@seznam/szn-select/embeddableLoader.js'),
    './index.js',
  ].map(readFile))

  try {
    await util.promisify(fs.mkdir)('./dist', 0o775)
  } catch (_) {}

  writeFile('./dist/index.js', component.replace('// %{EMBEDDABLE_LOADER}%', loader))

  done()
}

function compileModule() {
  return gulp.src('./dist/index.js')
    .pipe(babel({
      presets: [['@babel/preset-env', {
        targets: {
          node: '8', // current LTS
        },
      }]],
    }))
    .pipe(replace('<VERSION>', compatibleVersionRange))
    .pipe(gulp.dest('./dist'))
}

const compile = gulp.series(
  injectLoader,
  compileModule,
)

function copyMetaFiles() {
  return gulp.src(['package.json', './LICENSE', './README.md'])
    .pipe(replace('<VERSION>', compatibleVersionRange))
    .pipe(gulp.dest('./dist'))
}

exports.default = gulp.series(
  clean,
  gulp.parallel(
    compile,
    copyMetaFiles,
  ),
)
