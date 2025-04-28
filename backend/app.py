from flask import Flask, request, send_file, render_template
import os
from flask_cors import CORS
import subprocess
import shutil

# Dynamically get the correct Python path (for flexibility)
PYTHON_PATH = os.getenv("PYTHON_ENV_PATH", "/Users/josecalles/Desktop/IMEx_Projects/Report-App/backend/venv/bin/python3")


app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
RESULT_FOLDER = 'results'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'Missing file'
    
    file = request.files['file']
    checkedLogs = request.form.getlist("checkedItems")
    

    if file.filename == '':
        return 'No selected file'
    
    if file:
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        # Select notebook based on the analyisis type
        notbook_filename = "Notebooks/weight-report.ipynb"
        # Call Jupyter notebook processing function
        result_filepath = process_notebook(filepath, checkedLogs, notbook_filename)

        return send_file(result_filepath, as_attachment=True)


def process_notebook(filepath, checkedLogs, notebook_filename):
    result_pdf = os.path.join(RESULT_FOLDER, 'report.html')
    temp_notebook = 'temp_notebook.ipynb'

    # Copy the selected notebook to a temporary file to modify
    shutil.copy(notebook_filename, temp_notebook)

    # Open and modify the notebook to include the file path
    with open(temp_notebook, 'r') as file:
        notebook_content = file.read()

    # Update the notebook content with the file path
    filepath_str = repr(filepath)
    logs_str = repr(checkedLogs)
    notebook_content = notebook_content.replace('FILE_PATH_PLACEHOLDER', filepath_str)
    notebook_content = notebook_content.replace('LOGS_PLACEHOLDER', logs_str)


    with open(temp_notebook, 'w') as file:
        file.write(notebook_content)

    # Run the Jupyter notebook with the updated file path
    #command = f'{PYTHON_PATH} -m jupyter nbconvert --to html --no-input --execute --output {result_pdf} {temp_notebook}'
    command = f"{PYTHON_PATH} -m jupyter nbconvert --to html --execute --ExecutePreprocessor.kernel_name=flask_env  --no-input --output {result_pdf} {temp_notebook}"
   
    print("Running command:", command)  # Debug print statement
    subprocess.run(command, shell=True, check=True)
    
    # Clean up
    os.remove(temp_notebook)
    
    return result_pdf

if __name__ == '__main__':
    app.run(debug=True)