# We only need python to build and run backend, use minimal image.
FROM python:3.10-slim

# Some env vars for python, to ensure that we have immediate logging and clean build.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Non-root user for security. We don't want to run a backend app as root.
RUN useradd -m backend

# We keep backend code under app, ch dir.
WORKDIR /app

# Copy requirements for pip install step.
COPY requirements.txt /app/

# Install backend dependencies.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the source file to image.
COPY . /app/

# Move ownership under "secure" user.
RUN chown -R backend:backend /app

# Switch to the non-root user for running the app.
USER backend

# Expose the port 5000 our Flask app.
EXPOSE 5000

# Run the Flask application using a WSGI server -- gunicorn in this case, this is more reliable and more lightweight for production.
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
