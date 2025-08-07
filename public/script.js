let currentQuestion;
fetch('/question').then(r => r.json()).then(q => {
  currentQuestion = q;
  document.getElementById('question').textContent = q.question;
});

document.getElementById('submit').addEventListener('click', () => {
  const answer = document.getElementById('answer').value;
  fetch('/answer', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ id: currentQuestion.id, answer })
  }).then(r => r.json()).then(res => {
    if (res.correct) {
      alert('Correct!');
    } else {
      alert('Answer is not correct');
    }
  });
});
