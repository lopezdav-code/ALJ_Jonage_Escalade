@echo off
echo Installing requirements...
pip install -r requirements.txt
echo.
echo Running PDF Extractor...
python extract_images.py
echo.
echo Done.
pause
