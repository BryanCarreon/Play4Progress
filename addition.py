import random

def generate_addition_problem(level):
    """Generate a simple addition problem based on the difficulty level."""
    ranges = {
        1: (1, 5),
        2: (1, 10),
        3: (1, 15),
        4: (1, 20)
    }
    min_val, max_val = ranges.get(level, (1, 5))
    num1 = random.randint(min_val, max_val)
    num2 = random.randint(min_val, max_val)
    correct_answer = num1 + num2
    
    # Generate multiple-choice options
    choices = [correct_answer]
    while len(choices) < 4:
        option = random.randint(min_val, max_val * 2)
        if option not in choices:
            choices.append(option)
    random.shuffle(choices)
    
    return num1, num2, correct_answer, choices

def present_addition_problem(num1, num2, choices):
    """Display the addition problem and choices in text format."""
    print(f"What is {num1} + {num2}?")
    for i, choice in enumerate(choices, 1):
        print(f"{i}. {choice}")

def main():
    """Main function to run the multiple-choice math learning program."""
    correct_answers = 0
    level = 1
    
    while True:
        num1, num2, correct_answer, choices = generate_addition_problem(level)
        present_addition_problem(num1, num2, choices)
        
        try:
            answer_index = int(input("Choose the correct answer (1-4): ")) - 1
            user_answer = choices[answer_index]
        except (ValueError, IndexError):
            print("Invalid choice. Please select a number between 1 and 4.")
            continue
        
        if user_answer == correct_answer:
            print("Correct!")
            correct_answers += 1
            if correct_answers % 5 == 0:
                level = min(level + 1, 4)  # Cap level at 4
                print(f"Great job! Moving to level {level}.")
        else:
            print(f"Incorrect! The correct answer was {correct_answer}.")
            correct_answers = max(0, correct_answers - 1)  # Penalize for wrong answers

if __name__ == "__main__":
    main()
