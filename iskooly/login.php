const payload = {
email: formData.get('email'),
password: formData.get('password')
};
const response = await fetch('/api/login', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(payload)
});
const data = await response.json();
