// ## Backend Code ##
import express from "express";
import mysql from "mysql";
import cors from "cors";

const bcrypt = ('bcrypt');

const app = express()

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "pfa"
})

app.use(express.json());
app.use(cors());

app.get("/", (req,res) => {
  res.json("hello this is the backend")
})


// Displaying All Questions
app.get("/AllQuestions" , (req,res) => {
  const q = "select * from question"
  db.query(q,(err,data) => {
    if (err) return res.json(err)
    return res.json(data)
  })
})

// -- Displaying General Questions with/without Options --
app.get("/general", (req, res) => {
  const q = `
    SELECT q.idQuestion, q.questionText, q.questionOptionExist,  q.questionImage, o.idoptions, o.optionText, o.optionImage
    FROM question q
    LEFT JOIN options o ON q.idQuestion = o.questionID
    WHERE q.domainID = 1;
  `;
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    const questions = [];
    const questionMap = new Map();

    data.forEach((row) => {
      if (!questionMap.has(row.idQuestion)) {
        questionMap.set(row.idQuestion, {
          idQuestion: row.idQuestion,
          questionText: row.questionText,
          questionImage: row.questionImage,
          questionOptionExist: row.questionOptionExist,
          options: [],
        });
        questions.push(questionMap.get(row.idQuestion));
      }
      if (row.optionText) {
        questionMap.get(row.idQuestion).options.push({ 
          optionText: row.optionText, 
          optionImage: row.optionImage,
        });
      }
    });

    return res.json(questions);
  });
});

// -- Displaying Questions + Options Depending Domain --
app.get("/questions/:domainID", (req, res) => {
  const { domainID } = req.params;
  const q = `
  SELECT q.idQuestion, q.questionText, q.questionOptionExist, q.questionImage,
  o.idoptions, o.optionText, o.optionImage
  FROM question q
  LEFT JOIN options o ON q.idQuestion = o.questionID
  WHERE q.domainID = ?;
`;

  db.query(q, [domainID], (err, data) => {
    if (err) return res.json(err);
    const questions = [];
    const questionMap = new Map();

    data.forEach((row) => {
      if (!questionMap.has(row.idQuestion)) {
        questionMap.set(row.idQuestion, {
          idQuestion: row.idQuestion,
          questionText: row.questionText,
          questionImage: row.questionImage,
          questionOptionExist: row.questionOptionExist,
          options: [],
        });
        questions.push(questionMap.get(row.idQuestion));
      }
      if (row.optionText) {
        questionMap.get(row.idQuestion).options.push({ 
          optionText: row.optionText,
          optionImage: row.optionImage,
        });
      }
    });

    return res.json(questions);
  });
});

// -- Inserting Questions with/without Options --
app.post("/insertQuestion", (req, res) => {
  const { questionText,questionImage, domainID, questionOptionExist, options} = req.body;
  const q1 = "INSERT INTO question (questionText, domainID, questionOptionExist, questionImage) VALUES ( ?, ?, ?,?)";
  const values = [questionText, domainID, questionOptionExist, questionImage];

  db.query(q1, values, (err, questionResult) => {
    if (err) {
      return res.json(err);
    }
    if (questionOptionExist === 1 && Array.isArray(options) && options.length > 0) {
      const questionID = questionResult.insertId;
      const q2 = "INSERT INTO options (optionText, optionImage, questionID) VALUES ?";

      const optionValues = [];
      for (const option of options) {
        optionValues.push([option.optionText, option.optionImage, questionID]);
      }

      db.query(q2, [optionValues], (err, optionsResult) => {
        if (err) {
          return res.json(err);
        }
        return res.json({ message: "Question and options inserted successfully", questionID });
      });
    } else {
      return res.json({ message: "Question inserted successfully", questionID: questionResult.insertId });
    }
  });
});

// -- Inserting Options --
app.post("/insertOption", (req, res) => {
  const { options } = req.body;

  if (!Array.isArray(options) || options.length === 0) {
    return res.status(400).json({ error: "Invalid options data" });
  }

  const q = "INSERT INTO options (optionText, optionImage, questionID) VALUES (?, ?, ?)";
  const optionValues = [];

  for (const option of options) {
    const { optionText, optionImage, questionID } = option; 
    optionValues.push([optionText, optionImage, questionID]);
  }

  db.query(q, [optionValues], (err, optionsResult) => {
    if (err) {
      return res.status(500).json({ error: "Failed to insert options" });
    }
    return res.json({ message: "Options inserted successfully" });
  });
});

// -- Deleting Questions with/without Options --
  app.delete("/questions/:id", (req, res) => {
    const idQuestion = req.params.id;
    const q = "DELETE FROM question WHERE idQuestion=?";
  
    db.query(q, [idQuestion], (err, data) => {
      if (err) return res.json(err);
      return res.json("Question and its options have been deleted successfully.");
    });
  });

// -- Deleting Options => Works Correctly --
app.delete("/deleteOptions/:id", (req,res)=>{
  const idoptions= req.params.id;
  const q = "DELETE FROM options WHERE idoptions=?"

  db.query(q,[idoptions], (err,data) =>{
    if (err) return res.json(err);
    return res.json("Option has been deleted successfully.")
  })
})

// -- Update Question => Works Correctly --
app.put("/updateQuestion/:id", (req, res) => {
  const q = "UPDATE question SET `questionText`= ? WHERE idQuestion=?";
  const id = req.params.id;
  
  db.query(q, [req.body.questionText, id], (err, result) => {
    if (err) return res.json(err);
    return res.json("Question has been updated successfully.");
  });
});

  // -- Update Option => Works Correctly --
  app.put("/options/:id", (req, res) => {
    const idoptions = req.params.id;
    const q = "UPDATE options SET `optionText`= ? WHERE idoptions=?";
    const values = [
      req.body.optionText
    ]

    db.query(q, [...values,idoptions], (err, data) => {
      if (err) return res.json(err);
      return res.json("Option has been updated successfully.");
    });
  });

//#####################################################################################

    //-- Displaying All Candidat Info -- 
    app.get("/allCandidats", (req,res)=>{
      const q ="SELECT idCandidat, nameCandidat, familyNameCandidat, emailCandidat, domaineCandidat, dateInserted FROM candidat"
      db.query(q,(err,data) => {
        if(err) return res.json(err)
        return res.json(data)
      })
    })

    //-- Displaying Number Of Candidats  -- 
    app.get("/numCandidats", (req, res) => {
      const q = "SELECT COUNT(*) AS numCandidats FROM candidat"; 
      db.query(q, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
      });
    });   

  //-- Displaying A Candidat Info -- 
  app.get("/Candidat/:idCandidat", (req, res) => {
    const idCandidat = req.params.idCandidat;
    const q = "SELECT  idCandidat, nameCandidat, familyNameCandidat, emailCandidat, domaineCandidat, dateInserted FROM candidat WHERE idCandidat=?";
      
    db.query(q, [idCandidat], (err, data) => {
      if (err) return res.json(err);

      return res.json(data);
    });
  });

    //-- Inserting Candidat Info -- 
  app.post("/insertCandidat", (req, res) => {
    const { nameCandidat, familyNameCandidat, emailCandidat, domaineCandidat } = req.body;
    const q = "INSERT INTO candidat (nameCandidat, familyNameCandidat, emailCandidat, domaineCandidat, dateInserted) VALUES (?, ?, ?, ?, CURDATE())";
  
    db.query(q, [nameCandidat, familyNameCandidat, emailCandidat, domaineCandidat], (err, result) => {
      if (err) return res.json(err);
      return res.json({ message: "Record inserted successfully", insertedId: result.insertId });
    });
  }); 

    //-- Inserting Candidat Responses -- 
  app.post("/insertCandidatResponse", (req, res) => {
    const { candidatResponseText, questionID, candidateID } = req.body;
  
    // Insert INTO Table : candidatresponse
    const insertResponseQuery = "INSERT INTO candidatresponse (candidatResponseText) VALUES (?)";
  
    db.query(insertResponseQuery, [candidatResponseText], (err, responseResult) => {
      if (err) {
        console.error("Error inserting candidate response:", err);
        return res.json({ error: "Error inserting candidate response" });
      }
  
      const responseID = responseResult.insertId;
  
      // Insert INTO Table : answer
      const insertAnswerQuery = "INSERT INTO answer (questionID, candidatResponseID) VALUES (?, ?)";
  
      db.query(insertAnswerQuery, [questionID, responseID], (err, answerResult) => {
        if (err) {
          console.error("Error inserting answer:", err);
          return res.json({ error: "Error inserting answer" });
        }
  
        // Insert INTO Table : assoccandidat
        const insertAssocQuery = "INSERT INTO assoccandidat (responseID, candidateID) VALUES (?, ?)";
  
        db.query(insertAssocQuery, [responseID, candidateID], (err, assocResult) => {
          if (err) {
            console.error("Error inserting assocCandidat:", err);
            return res.json({ error: "Error inserting assocCandidat" });
          }
  
          return res.json({ message: "Candidate response, answer, and assocCandidat inserted successfully", insertedIds: { answer: answerResult.insertId, assocCandidat: assocResult.insertId } });
        });
      });
    });
  });

    //-- Displaying Candidat Responses -- 
  app.get("/getCandidatResponses/:candidateID", (req, res) => {
    const candidateID = req.params.candidateID;

    const getCandidatResponsesQuery = `
      SELECT
      cr.idcandidatResponse,
      cr.candidatResponseText,
      q.idQuestion,
      q.questionText,
      d.nameDomain
    FROM candidatresponse cr
    JOIN answer a ON cr.idcandidatResponse = a.candidatResponseID
    JOIN question q ON a.questionID = q.idQuestion
    JOIN domain d ON q.domainID = d.idDomain
    JOIN assoccandidat ac ON cr.idcandidatResponse = ac.responseID
    WHERE ac.candidateID = ?
    `;

    db.query(getCandidatResponsesQuery, [candidateID], (err, responseResults) => {
      if (err) {
        console.error("Error fetching candidate responses:", err);
        return res.status(500).json({ error: "Error fetching candidate responses" });
      }

      const candidateResponses = [];

      responseResults.forEach((row) => {
        candidateResponses.push({
          idcandidatResponse: row.idcandidatResponse,
          candidatResponseText: row.candidatResponseText,
          question: {
            idQuestion: row.idQuestion,
            questionText: row.questionText,
            domain: row.nameDomain,
          },
        });
      });

      return res.json({ candidateResponses });
    });
  });

// -- Delete Candidate --
app.delete("/Candidat/:id", (req, res) => {
  const id = req.params.id;

  // Delete Candidate Response
  const deleteResponsesQuery = "DELETE FROM candidatresponse WHERE idcandidatResponse IN (SELECT ac.responseID FROM assoccandidat ac WHERE ac.candidateID = ?)";

  db.query(deleteResponsesQuery, [id], (err, responseResult) => {
    if (err) {
      console.error("Error deleting candidate responses:", err);
      return res.json({ error: "Error deleting candidate responses" });
    }

    // Delete Candidate
    const deleteCandidateQuery = "DELETE FROM candidat WHERE idCandidat = ?";

    db.query(deleteCandidateQuery, [id], (err, candidateResult) => {
      if (err) {
        console.error("Error deleting candidate:", err);
        return res.json({ error: "Error deleting candidate" });
      }

      return res.json("Candidat and associated responses have been deleted successfully");
    });
  });
});

//#####################################################################################

 //-- Login --

  const storedPassword = '$2a$10$7eqjKW2Z7$kpB9*qrX#2vF%';

  app.post('/login', (req, res) => {
    const providedPassword = req.body.password;
  
    if (providedPassword === storedPassword) {
      return res.json({ Status: 'Success' });
    } else {
      return res.json({ Error: 'Password not matched' });
    }
  });

app.listen(8800, () => {
  console.log("connected !")
})