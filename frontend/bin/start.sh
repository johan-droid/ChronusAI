#!/bin/bash
# Frontend startup script for Heroku
# Sets up nginx-like static serving via serve package

npx serve -s dist -l $PORT
