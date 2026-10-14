package com.cdmga.uestc.webpage.Repository;

import com.cdmga.uestc.webpage.Entity.TitleDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TitleDefinitionRepository extends JpaRepository<TitleDefinition, Integer> {
    List<TitleDefinition> findAllByOrderByIdDesc();
}
