import React, { useState } from 'react'
import { API_KEY } from './config'
import QuestionForm from './QuestionForm'
import Quiz from './Quiz'
import Results from './Results'

function App() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState([])
  const [showResults, setShowResults] = useState(false)

  const generateQuestions = async (formData) => {
    setLoading(true)
    setError(null)
    try {
      const prompt = formData.text
        ? `À partir du texte suivant : "${formData.text}", génère ${formData.numberOfQuestions} questions à choix multiples sur le sujet "${formData.topic}" pour un niveau ${formData.studyLevel}. Inclus les réponses correctes et des explications pour chaque réponse. Formatte la réponse en JSON valide avec un tableau de questions, chaque question ayant les propriétés suivantes : question (string), options (un tableau de 4 strings), correctAnswer (l'index de la bonne réponse, number), et explanation (string). Retourne uniquement le JSON, sans texte supplémentaire.`
        : `Génère ${formData.numberOfQuestions} questions à choix multiples sur le sujet "${formData.topic}" pour un niveau ${formData.studyLevel}. Inclus les réponses correctes et des explications pour chaque réponse. Formatte la réponse en JSON valide avec un tableau de questions, chaque question ayant les propriétés suivantes : question (string), options (un tableau de 4 strings), correctAnswer (l'index de la bonne réponse, number), et explanation (string). Retourne uniquement le JSON, sans texte supplémentaire.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      })
      
      const data = await response.json()
      if (data.choices && data.choices[0].message) {
        const content = data.choices[0].message.content
        const jsonMatch = content.match(/\[.*\]/s)
        if (jsonMatch) {
          try {
            const parsedQuestions = JSON.parse(jsonMatch[0])
            setQuestions(parsedQuestions)
            setCurrentQuestionIndex(0)
            setUserAnswers(new Array(parsedQuestions.length).fill(null))
            setShowResults(false)
          } catch (err) {
            setError('Erreur lors du parsing des questions')
          }
        } else {
          setError('Aucun JSON valide trouvé dans la réponse')
        }
      }
    } catch (err) {
      setError('Erreur lors de la génération des questions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Générateur de Questions</h1>
      {questions.length === 0 ? (
        <QuestionForm onSubmit={generateQuestions} loading={loading} />
      ) : showResults ? (
        <Results 
          questions={questions}
          userAnswers={userAnswers}
          onRestart={() => {
            setQuestions([])
            setUserAnswers([])
            setShowResults(false)
          }}
        />
      ) : (
        <Quiz
          question={questions[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          selectedAnswer={userAnswers[currentQuestionIndex]}
          onAnswer={(index) => {
            const newAnswers = [...userAnswers]
            newAnswers[currentQuestionIndex] = index
            setUserAnswers(newAnswers)
          }}
          onNext={() => {
            if (currentQuestionIndex < questions.length - 1) {
              setCurrentQuestionIndex(currentQuestionIndex + 1)
            }
          }}
          onSubmit={() => setShowResults(true)}
        />
      )}
      {error && <p className="text-red-500 text-center">{error}</p>}
    </div>
  )
}

export default App
