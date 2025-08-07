function loadQuestions() {
  fetch('/admin/questions').then(r => r.json()).then(list => {
    const ul = document.getElementById('qList');
    ul.innerHTML = '';
    list.forEach(q => {
      const li = document.createElement('li');
      li.textContent = q.question + ' => ' + q.answer;
      ul.appendChild(li);
    });
  });
}

document.getElementById('loginBtn').addEventListener('click', () => {
  const username = document.getElementById('user').value;
  const password = document.getElementById('pass').value;
  fetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }).then(r => r.json()).then(res => {
    if (res.success) {
      document.getElementById('login').style.display = 'none';
      document.getElementById('panel').style.display = 'block';
      loadQuestions();
    } else {
      alert('Login failed');
    }
  });
});

document.getElementById('addBtn').addEventListener('click', () => {
  const question = document.getElementById('newQ').value;
  const answer = document.getElementById('newA').value;
  fetch('/admin/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer })
  }).then(r => r.json()).then(res => {
    if (res.success) {
      document.getElementById('newQ').value = '';
      document.getElementById('newA').value = '';
      loadQuestions();
    }
  });
});
