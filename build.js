'use strict';

const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const SOURCE_PATH = path.resolve('./src');
const SOURCES = [
  'Animation',
  'Clock',
  'Score',
  'Block',
  'Board',
  'Game',
];
const HTML_PATH = path.resolve('./public_html');
const BUILD_PATH = path.resolve('./build');
const TARGET_NAME = 'colorblockmatch.js';
const LIBRARY = 'gameapi';

function copyFile(source, destination) {
  console.log(`Copying ${source} to ${destination}`);
  return new Promise((resolve, reject) => {
    fs.readFile(source, (err, data) => {
      if (err) { return reject(err); }
      fs.writeFile(destination, data, err => {
        if (err) { return reject(err); }
        resolve({ source, destination, data });
      });
    });
  });
}

function loadSource(index) {
  const sourceFilePath = path.join(SOURCE_PATH, `${SOURCES[index]}.js`);
  console.log(`Loading source [${index}] "${SOURCES[index]}" from ${sourceFilePath}`);
  return new Promise((resolve, reject) => {
    fs.readFile(sourceFilePath, (err, data) => {
      if (err) { return reject(err); }
      resolve(data);
    });
  });
}

function compileSources() {
  const targetFilePath = path.join(BUILD_PATH, TARGET_NAME);
  const provideExport = `window.console.log('Adding Window Export Function');
window.$export = window.$export || function (ClassType) {
window.${LIBRARY} = window.${LIBRARY} || {};
(function () {
  var p = new ClassType();
  window.console.log('Exporting ' + p.constructor.name);
  window.${LIBRARY}[p.constructor.name] = ClassType;
}());
};`;
  const HEADER = `${provideExport}\n// ${TARGET_NAME}`;
  const FOOTER = `// (C) Copyright 2016, Richard Marks <ccpsceo@gmail.com>`;
  return new Promise((resolve, reject) => {
    const BODY = [];
    const sourceCount = SOURCES.length;
    const loadPromises = [];
    for (let i = 0; i < sourceCount; i += 1) {
      loadPromises.push(loadSource(i).then(data => BODY.push(data)).catch(err => reject(err)));
    }
    Promise.all(loadPromises).then(() => {
      const IIFE_BEGIN = `(function () {\n`;
      const IIFE_END = '\n}());'
      const modules = BODY.map(code => `${IIFE_BEGIN}${code}${IIFE_END}`);
      const CONTENT = [IIFE_BEGIN, HEADER, modules.join('\n'), FOOTER, IIFE_END].join('\n');
      fs.writeFile(targetFilePath, CONTENT, err => {
        if (err) { return reject(err); }
        resolve();
      });
    });
  });
}

function copyIndex() {
  return copyFile(path.join(HTML_PATH, 'index.html'), path.join(BUILD_PATH, 'index.html'));
}

function finish() {
  console.log('BUILD FINISHED');
}

function build() {
  copyIndex().then(() => {
    console.log('Index copy pass complete');
  }).then(compileSources).then(() => {
    console.log('Source compilation pass complete');
  }).then(finish);
}

build();