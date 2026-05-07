export default function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;
    
    console.log('Email:', email);
    console.log('Password:', password);

    // Redirect to awareness.html after submission
    res.redirect(302, '/awareness.html');
  }
}