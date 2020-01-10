"use strict";

var gulp = require("gulp");
var del = require("del");
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");
var webp = require("gulp-webp");
var imagemin = require("gulp-imagemin");
var plumber = require("gulp-plumber");
var sourcemap = require("gulp-sourcemaps");
var rename = require("gulp-rename");
var svgstore = require("gulp-svgstore");
var less = require("gulp-less");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var csso = require("gulp-csso");
var server = require("browser-sync").create();
var htmlmin = require("gulp-htmlmin");
var uglify = require('gulp-uglify');

//CSS-минификация,расставление префиксов

gulp.task("css", function() {
  return gulp.src("source/less/style.less")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(less())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(csso())
    .pipe(rename("style.min.css"))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});

//Оптимизация изображений

gulp.task("images", function() {
  return gulp.src("source/img/**/*.{png, jpg, svg}")
    .pipe(imagemin([
      imagemin.optipng({
        optimizationLevel: 3
      }),
      imagemin.jpegtran({
        progressive: true
      }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("source/img"));
});

//Создание webp-формата

gulp.task("webp", function() {
  return gulp.src("source/img/**/*.{png, jpg}")
    .pipe(webp({
      quality: 90
    }))
    .pipe(gulp.dest("source/img"));
});

//Создание спрайта

gulp.task("sprite", function() {
  return gulp.src("source/img/icon-*.svg")
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
});

//HTML-добавление вирт.тега и минификация

gulp.task("html", function() {
  return gulp.src("source/*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest("build"));
});

//Копирование файлов в продакшн

gulp.task("copy", function() {
  return gulp.src([
      "source/fonts/**/*.{woff, woff2}",
      "source/img/**",
      "source/js/**",
      "source/*.ico"
    ], {
      base: "source"
    })
    .pipe(gulp.dest("build"));
});

//Удаление папки build

gulp.task("clean", function() {
  return del("build");
});

//Автоматическая перезагрузка страницы

gulp.task("refresh", function(done) {
  server.reload();
  done();
});

//Минификация js

gulp.task('jsmin', function() {
  return gulp.src('source/js/**/*.js')
    .pipe(plumber())
    .pipe(uglify())
    .pipe(rename("script.min.js"))
    .pipe(gulp.dest('build/js'))
});

gulp.task("server", function() {
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/less/**/*.less", gulp.series("css"));
  gulp.watch("source/img/icon-*.svg", gulp.series("sprite", "html", "refresh"));
  gulp.watch("source/*.html", gulp.series("html", "refresh"));
  gulp.watch("source/js/*.js", gulp.series("jsmin", "refresh"));
});

gulp.task("build", gulp.series(
  "clean",
  "copy",
  "css",
  "jsmin",
  "images",
  "webp",
  "sprite",
  "html"
));

gulp.task("start", gulp.series("build", "server"));
