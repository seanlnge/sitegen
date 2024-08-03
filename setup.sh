#!/bin/bash

touch .env

read -p "OPENAI_API_KEY=" openai
read -p "INSTA_USER=" insta_user
read -p "INSTA_PASS=" insta_pass
read -p "FACEBOOK_EMAIL=" fb_eml
read -p "FACEBOOK_PASS=" fb_pass

if [ -z "$openai" ] || [ -z "$insta_user" ] || [ -z "$insta_pass" ] || [ -z "$fb_user" ] || [ -z "$fb_pass" ]; then
    echo -e "\e[31mError: All fields are required.\e[0m"
    exit 1
fi

{
    echo "OPENAI_API_KEY=$openai"
    echo "INSTA_USER=$insta_user"
    echo "INSTA_PASS=$insta_pass"
    echo "FACEBOOK_EMAIL=$fb_eml"
    echo "FACEBOOK_PASS=$fb_pass"
} >> .env

echo ".env updated successfully"