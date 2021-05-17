import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import { resolve } from "path";
import { SurveysRepository } from "../repositories/SurveysRepository";
import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository";
import { UsersRepository } from "../repositories/UserRepository";
import  SendMailService  from "../services/SendMailService";
//import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository";
class SendMailController {
    async execute(request: Request, response: Response){
        const { email, survey_id } = request.body;

        const usersRepository = getCustomRepository(UsersRepository);
        const surveysRepository = getCustomRepository(SurveysRepository)
        const surveysUsersRepository = getCustomRepository(SurveysUsersRepository)
        //const surveysUserRepository = getCustomRepository(SurveysUsersRepository);

        const user = await usersRepository.findOne({email});
        
        if(!user) {
            return response.status(400).json({
                erro: "User does not exist",
            });
        }
            const survey = await surveysRepository.findOne({id: survey_id})
            if(!survey) {
                return response.status(400).json({
                    error: "Survey does not exist",
               });
        }

        const npsPath =  resolve(__dirname, "..", "views", "emails", "npsMail.hbs");

        const surveyUserAlreadyExists = await surveysUsersRepository.findOne({
            where: {user_id: user.id, value: null},
            relations:["user", "survey"]
        });  

        
        const variables = {
            name: user.name,
            title: survey.title,
            description: survey.description,
            id: "",
            link: "http://localhost:3333/answers",
        };

        if(surveyUserAlreadyExists){
            variables.id = surveyUserAlreadyExists.id;
            await SendMailService.execute(email, survey.title, variables, npsPath);
            return response.json(surveyUserAlreadyExists);
        }
        // Salvar as informações na tabela Survey User
        // Enviar e-mail para o usuario

        const surveyUser = surveysUsersRepository.create({
            user_id: user.id,
            survey_id
        })

        
        await surveysUsersRepository.save(surveyUser);
        //Enviar e-mail para o usuario para
             variables.id = surveyUser.id;
      
        await SendMailService.execute(email, survey.title ,variables, npsPath);


        return response.json(surveyUser);
        
    }
        
}

export  { SendMailController };